import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { AuthModule } from './auth/auth.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { AdminModule } from './admin/admin.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    CoursesModule,
    AuthModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    AdminModule,
    QuizzesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
