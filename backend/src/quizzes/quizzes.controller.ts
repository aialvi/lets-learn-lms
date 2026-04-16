import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new quiz (teacher only)' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  create(@Body() createQuizDto: CreateQuizDto, @Request() req) {
    return this.quizzesService.createQuiz(createQuizDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all quizzes for a course' })
  getQuizzesByCourse(
    @Param('courseId') courseId: string,
    @Request() req,
  ) {
    return this.quizzesService.getQuizzesByCourse(courseId, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('attempts/my')
  @ApiOperation({ summary: 'Get all quiz attempts for current user' })
  getUserQuizAttempts(@Request() req) {
    return this.quizzesService.getUserQuizAttempts(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.quizzesService.getQuizById(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a quiz (teacher only)' })
  update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Request() req,
  ) {
    return this.quizzesService.updateQuiz(id, updateQuizDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quiz (teacher only)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.quizzesService.deleteQuiz(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  @ApiOperation({ summary: 'Start a quiz (student only)' })
  startQuiz(@Param('id') id: string, @Request() req) {
    return this.quizzesService.startQuiz(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit quiz answers (student only)' })
  submitQuiz(
    @Param('id') id: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @Request() req,
  ) {
    return this.quizzesService.submitQuiz(id, req.user.id, submitQuizDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/result')
  @ApiOperation({ summary: 'Get quiz result' })
  getQuizResult(@Param('id') id: string, @Request() req) {
    return this.quizzesService.getQuizResult(id, req.user.id);
  }
}
