import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StudyCoachDto } from './dto/study-coach.dto';

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  id?: string;
  model?: string;
  choices?: OpenRouterChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

@Injectable()
export class AiService {
  private readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createStudyCoachResponse(userId: string, dto: StudyCoachDto) {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OpenRouter is not configured. Set OPENROUTER_API_KEY in backend/.env.',
      );
    }

    const model =
      this.config.get<string>('OPENROUTER_MODEL') || 'openrouter/auto';
    const context = await this.getLearnerContext(userId, dto);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000',
        'X-Title': "Let's Learn LMS",
      },
      body: JSON.stringify({
        model,
        max_tokens: 650,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are the Let\'s Learn AI study coach. Give concise, practical learning guidance. Use the learner context when available. Avoid inventing course content. Format with short headings and bullets. Always include: Next best action, Practice prompt, and Proof of learning.',
          },
          {
            role: 'user',
            content: [
              `Learner context:\n${context}`,
              `Intent: ${dto.intent || 'general coaching'}`,
              `Learner request: ${dto.prompt}`,
            ].join('\n\n'),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `OpenRouter request failed (${response.status}): ${errorText.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new InternalServerErrorException(
        'OpenRouter returned an empty coach response.',
      );
    }

    return {
      content,
      model: data.model || model,
      generationId: data.id,
      usage: data.usage,
    };
  }

  private async getLearnerContext(userId: string, dto: StudyCoachDto) {
    const courseIds = [
      ...(dto.courseId ? [dto.courseId] : []),
      ...(dto.recentCourseIds || []),
    ].slice(0, 5);

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        ...(courseIds.length ? { courseId: { in: courseIds } } : {}),
      },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    if (dto.courseId && enrollments.length === 0) {
      throw new BadRequestException(
        'You must be enrolled in this course to request course-specific coaching.',
      );
    }

    if (enrollments.length === 0) {
      return 'No enrolled courses yet. Recommend a short onboarding path and a first course selection strategy.';
    }

    const progress = await this.prisma.videoProgress.findMany({
      where: {
        userId,
        courseId: {
          in: enrollments.map((enrollment) => enrollment.courseId),
        },
      },
      select: {
        courseId: true,
        lessonId: true,
        completed: true,
        watchTime: true,
      },
    });

    return enrollments
      .map((enrollment) => {
        const courseProgress = progress.filter(
          (item) => item.courseId === enrollment.courseId,
        );
        const completed = courseProgress.filter((item) => item.completed).length;
        const watchMinutes = Math.round(
          courseProgress.reduce((sum, item) => sum + (item.watchTime || 0), 0) /
            60,
        );
        const lessons = enrollment.course.lessons
          .slice(0, 8)
          .map((lesson) => `${lesson.order}. ${lesson.title}`)
          .join('; ');

        return [
          `Course: ${enrollment.course.title}`,
          `Description: ${enrollment.course.description || 'No description'}`,
          `Progress: ${completed}/${enrollment.course.lessons.length} lessons completed, ${watchMinutes} watch minutes`,
          `Lessons: ${lessons || 'No lessons yet'}`,
        ].join('\n');
      })
      .join('\n\n');
  }
}
