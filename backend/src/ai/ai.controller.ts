import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { StudyCoachDto } from './dto/study-coach.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('study-coach')
  createStudyCoachResponse(@Body() dto: StudyCoachDto, @Request() req) {
    return this.aiService.createStudyCoachResponse(req.user.id, dto);
  }
}
