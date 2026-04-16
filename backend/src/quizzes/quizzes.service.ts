import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, CreateQuestionDto, CreateOptionDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitQuizDto, QuestionAnswerDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async createQuiz(createQuizDto: CreateQuizDto, teacherId: string) {
    const { courseId, questions, ...quizData } = createQuizDto;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { author: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.authorId !== teacherId) {
      throw new ForbiddenException('You are not authorized to create quizzes for this course');
    }

    return this.prisma.quiz.create({
      data: {
        ...quizData,
        courseId,
        questions: {
          create: questions.map((question) => ({
            type: question.type,
            text: question.text,
            order: question.order,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: option.order,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async updateQuiz(quizId: string, updateQuizDto: UpdateQuizDto, teacherId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: { include: { author: true } } },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.course.authorId !== teacherId) {
      throw new ForbiddenException('You are not authorized to update this quiz');
    }

    const { questions, ...quizData } = updateQuizDto;

    return this.prisma.$transaction(async (tx) => {
      if (questions && questions.length > 0) {
        await tx.question.deleteMany({ where: { quizId } });

        const updatedQuiz = await tx.quiz.update({
          where: { id: quizId },
          data: {
            ...quizData,
            questions: {
              create: questions.map((question) => ({
                type: question.type,
                text: question.text,
                order: question.order,
                options: {
                  create: question.options.map((option) => ({
                    text: option.text,
                    isCorrect: option.isCorrect,
                    order: option.order,
                  })),
                },
              })),
            },
          },
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
        });

        return updatedQuiz;
      }

      return tx.quiz.update({
        where: { id: quizId },
        data: quizData,
        include: {
          questions: {
            include: { options: true },
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  async deleteQuiz(quizId: string, teacherId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: { include: { author: true } } },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.course.authorId !== teacherId) {
      throw new ForbiddenException('You are not authorized to delete this quiz');
    }

    return this.prisma.quiz.delete({
      where: { id: quizId },
    });
  }

  async getQuizById(quizId: string, userId: string, userRole: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
        },
        questions: {
          include: {
            options: userRole === 'teacher' ? true : { select: { id: true, text: true, order: true } },
          },
          orderBy: { order: 'asc' },
        },
        attempts: {
          where: { userId },
          include: {
            responses: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (userRole !== 'teacher') {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: quiz.courseId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
    }

    return quiz;
  }

  async getQuizzesByCourse(courseId: string, userId: string, userRole: string) {
    if (userRole !== 'teacher') {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
    }

    return this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async startQuiz(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true,
        questions: {
          include: { options: { select: { id: true, text: true, order: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const existingAttempt = await this.prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId,
          userId,
        },
      },
    });

    if (existingAttempt) {
      if (existingAttempt.status === 'completed') {
        throw new BadRequestException('You have already completed this quiz');
      }
      return existingAttempt;
    }

    return this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        status: 'in_progress',
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: { select: { id: true, text: true, order: true } } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async submitQuiz(quizId: string, userId: string, submitQuizDto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId,
          userId,
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found. Please start the quiz first.');
    }

    if (attempt.status === 'completed') {
      throw new BadRequestException('Quiz has already been submitted');
    }

    const { answers } = submitQuizDto;
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    const responsePromises = answers.map(async (answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        return null;
      }

      const correctOption = question.options.find((o) => o.isCorrect);
      const isCorrect = correctOption && correctOption.id === answer.selectedOptionId;

      if (isCorrect) {
        correctCount++;
      }

      return this.prisma.questionResponse.create({
        data: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: !!isCorrect,
        },
      });
    });

    await Promise.all(responsePromises);

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'completed',
        score,
        totalPoints: totalQuestions,
        completedAt: new Date(),
      },
      include: {
        quiz: true,
        responses: {
          include: {
            question: {
              include: { options: true },
            },
          },
        },
      },
    });

    return updatedAttempt;
  }

  async getQuizResult(quizId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId,
          userId,
        },
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        responses: {
          include: {
            question: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }

    return attempt;
  }

  async getUserQuizAttempts(userId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            course: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }
}
