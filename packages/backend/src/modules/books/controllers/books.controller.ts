import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BooksService } from '../services/books.service';
import { SearchBookDto } from '../dto/search-book.dto';
import { CreateBookDto } from '../dto/create-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  async search(@Query() query: SearchBookDto) {
    return this.booksService.searchBooks(query);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createBook(@Body() dto: CreateBookDto) {
    return this.booksService.createOrFindBook(dto);
  }

  @Get(':id')
  async getBook(@Param('id') id: string) {
    return this.booksService.getBook(id);
  }

  @Get(':id/reviews')
  async getBookReviews(
    @Param('id') id: string,
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 20,
    @Req() req?: { user?: { id?: string } }
  ) {
    const userId = req?.user?.id;
    return this.booksService.getBookReviews(id, { page, limit }, userId);
  }
}
