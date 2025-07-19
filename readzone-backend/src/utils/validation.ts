import Joi from 'joi';

// Auth validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '유효한 이메일 주소를 입력해주세요.',
    'any.required': '이메일은 필수 항목입니다.',
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': '사용자명은 영문자와 숫자만 사용할 수 있습니다.',
    'string.min': '사용자명은 최소 3자 이상이어야 합니다.',
    'string.max': '사용자명은 최대 30자까지 가능합니다.',
    'any.required': '사용자명은 필수 항목입니다.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': '비밀번호는 최소 8자 이상이어야 합니다.',
    'any.required': '비밀번호는 필수 항목입니다.',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().required().messages({
    'any.required': '이메일 또는 사용자명을 입력해주세요.',
  }),
  password: Joi.string().required().messages({
    'any.required': '비밀번호를 입력해주세요.',
  }),
});

// Profile validation schema
export const updateProfileSchema = Joi.object({
  displayName: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  avatar: Joi.string().uri().optional(),
  isPublic: Joi.boolean().optional(),
});

// Post validation schemas
export const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': '내용을 입력해주세요.',
    'string.max': '내용은 최대 2000자까지 입력할 수 있습니다.',
    'any.required': '내용은 필수 항목입니다.',
  }),
  isbn: Joi.string().required().messages({
    'any.required': '도서를 선택해주세요.',
  }),
  rating: Joi.number().integer().min(1).max(5).optional(),
  readingProgress: Joi.number().integer().min(0).max(100).optional(),
  tags: Joi.array().items(Joi.string().max(20)).max(5).optional(),
  isPublic: Joi.boolean().optional(),
});

export const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(2000).optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  readingProgress: Joi.number().integer().min(0).max(100).optional(),
  tags: Joi.array().items(Joi.string().max(20)).max(5).optional(),
  isPublic: Joi.boolean().optional(),
});

// Comment validation schemas
export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(500).required().messages({
    'string.min': '댓글 내용을 입력해주세요.',
    'string.max': '댓글은 최대 500자까지 입력할 수 있습니다.',
    'any.required': '댓글 내용은 필수 항목입니다.',
  }),
  parentId: Joi.string().optional(),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(500).required().messages({
    'string.min': '댓글 내용을 입력해주세요.',
    'string.max': '댓글은 최대 500자까지 입력할 수 있습니다.',
    'any.required': '댓글 내용은 필수 항목입니다.',
  }),
});

// Book search validation schema
export const bookSearchSchema = Joi.object({
  query: Joi.string().min(1).required().messages({
    'string.min': '검색어를 입력해주세요.',
    'any.required': '검색어는 필수 항목입니다.',
  }),
  sort: Joi.string().valid('accuracy', 'recency').optional(),
  page: Joi.number().integer().min(1).optional(),
  size: Joi.number().integer().min(1).max(50).optional(),
});

// Library validation schemas
export const libraryBookSchema = Joi.object({
  isbn: Joi.string().required().messages({
    'any.required': '도서를 선택해주세요.',
  }),
  status: Joi.string().valid('want_to_read', 'reading', 'completed').required(),
});

export const updateLibraryBookSchema = Joi.object({
  status: Joi.string().valid('want_to_read', 'reading', 'completed').optional(),
  currentPage: Joi.number().integer().min(0).optional(),
  totalPages: Joi.number().integer().min(1).optional(),
  notes: Joi.string().max(1000).optional(),
});

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

// Helper function for validation
export const validateData = (schema: Joi.Schema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new Error(messages.join(', '));
  }
  
  return value;
};