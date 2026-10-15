import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { OrganizationAccess } from './organization-access.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { TrainingService } from './training.service';
import { NotificationsService } from './notifications.service';
@Module({ imports: [PrismaModule, AiModule], controllers: [OrganizationsController], providers: [OrganizationAccess, OrganizationsService, TrainingService, NotificationsService] })
export class OrganizationsModule {}
