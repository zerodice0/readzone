import { Controller, Get, Param, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { SearchBooksDto } from './dto/search-books.dto';
import { GetBookDto } from './dto/get-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('search')
  async searchBooks(@Query() searchBooksDto: SearchBooksDto) {
    return this.booksService.searchBooks(searchBooksDto);
  }

  @Get('popular')
  async getPopularBooks() {
    return this.booksService.getPopularBooks();
  }

  @Get(':id')
  async getBook(@Param() getBookDto: GetBookDto) {
    return this.booksService.getBook(getBookDto);
  }
}
