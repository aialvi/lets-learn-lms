import { Controller, Post, Body, Get, Put, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  enroll(@Body() enrollData: { courseId: string }, @Request() req) {
    return this.enrollmentsService.enroll(req.user.id, enrollData.courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-courses')
  getUserEnrollments(@Request() req) {
    return this.enrollmentsService.getUserEnrollments(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('progress')
  updateProgress(
    @Body() progressData: { courseId: string; progress: number },
    @Request() req,
  ) {
    return this.enrollmentsService.updateProgress(
      req.user.id,
      progressData.courseId,
      progressData.progress,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':courseId/certificate')
  certificate(@Param('courseId') courseId: string, @Request() req) { return this.enrollmentsService.certificate(req.user.id, courseId); }

  @UseGuards(JwtAuthGuard)
  @Delete(':courseId')
  unenroll(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.unenroll(req.user.id, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':courseId/status')
  getEnrollmentStatus(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.getEnrollmentStatus(req.user.id, courseId);
  }
}
