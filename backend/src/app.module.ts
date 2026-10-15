import { OrganizationsModule } from './organizations/organizations.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LegacyAccessInterceptor } from './organizations/legacy-access.interceptor';
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
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    OrganizationsModule,
    UsersModule,
    CoursesModule,
    AuthModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    AdminModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: LegacyAccessInterceptor }],
})
export class AppModule {}
