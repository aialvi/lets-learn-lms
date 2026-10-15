import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: number, courseId: string) {
    // Check if enrollment already exists
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: userId.toString(),
        courseId: courseId,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.enrollment.create({
      data: {
        userId: userId.toString(),
        courseId: courseId,
      },
      include: {
        course: true,
      },
    });
  }

  async getEnrollmentStatus(userId: number, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: userId.toString(),
        courseId: courseId,
      },
    });

    return {
      isEnrolled: !!enrollment,
      enrollment: enrollment || null,
    };
  }

  async getUserEnrollments(userId: number) {
    return this.prisma.enrollment.findMany({
      where: { userId: userId.toString(), course: { organizationId: 'default-academic', isPublic: true } },
      include: {
        course: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  async updateProgress(userId: number, courseId: string, progress: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: userId.toString(),
        courseId: courseId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progress },
    });
  }

  async certificate(userId: string, courseId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: 'default-academic' } });
    if (!organization || !JSON.parse(organization.modules).includes('certifications')) throw new NotFoundException('Certification module unavailable');
    const certificate = await this.prisma.certificate.findFirst({ where: { organizationId: 'default-academic', userId, courseId } });
    if (!certificate) throw new NotFoundException('Complete the course to receive a certificate');
    return certificate;
  }

  async unenroll(userId: number, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: userId.toString(),
        courseId: courseId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.delete({
      where: { id: enrollment.id },
    });
  }
}
