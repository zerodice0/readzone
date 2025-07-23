// Enhanced Markdown System - ReadZone
// Complete markdown rendering system with accessibility, security, and performance features

export { 
  MarkdownRenderer, 
  getMarkdownSummary, 
  validateMarkdownContent, 
  getMarkdownStats 
} from './markdown-renderer'

export { TableOfContents } from './markdown-toc'
export { MarkdownPreview } from './markdown-preview'

// Type exports
export type { MarkdownRendererProps } from './markdown-renderer'
export type { TableOfContentsProps } from './markdown-toc'
export type { MarkdownPreviewProps } from './markdown-preview'

// Utility functions for markdown processing
export const MarkdownUtils = {
  /**
   * Extract plain text from markdown content
   */
  extractPlainText: (content: string): string => {
    return content
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/>\s+/g, '') // Blockquotes
      .replace(/[-*+]\s+/g, '') // Lists
      .replace(/\n+/g, ' ') // Line breaks
      .trim()
  },

  /**
   * Check if content contains specific markdown elements
   */
  hasMarkdownElements: (content: string) => ({
    hasHeadings: /^#{1,6}\s/m.test(content),
    hasLists: /^(\s*[-*+]\s|\s*\d+\.\s)/m.test(content),
    hasLinks: /\[([^\]]+)\]\([^)]+\)/.test(content),
    hasImages: /!\[([^\]]*)\]\([^)]+\)/.test(content),
    hasCodeBlocks: /```[\s\S]*?```/.test(content),
    hasInlineCode: /`[^`]+`/.test(content),
    hasTables: /\|.*\|/.test(content),
    hasBlockquotes: /^>\s/m.test(content)
  }),

  /**
   * Estimate reading difficulty (Flesch Reading Ease approximation for Korean)
   */
  estimateReadingDifficulty: (content: string): {
    level: 'easy' | 'medium' | 'hard'
    score: number
    description: string
  } => {
    const plainText = MarkdownUtils.extractPlainText(content)
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const words = plainText.split(/\s+/).filter(w => w.length > 0).length
    const characters = plainText.replace(/\s/g, '').length

    if (sentences === 0 || words === 0) {
      return { level: 'easy', score: 100, description: '내용이 없습니다' }
    }

    // Korean text difficulty approximation
    const avgWordsPerSentence = words / sentences
    const avgCharsPerWord = characters / words

    // Simple scoring system (0-100, higher = easier)
    let score = 100
    score -= (avgWordsPerSentence - 10) * 2 // Penalty for long sentences
    score -= (avgCharsPerWord - 3) * 5 // Penalty for long words
    score = Math.max(0, Math.min(100, score))

    if (score >= 70) {
      return { level: 'easy', score, description: '읽기 쉬움' }
    } else if (score >= 40) {
      return { level: 'medium', score, description: '보통 난이도' }
    } else {
      return { level: 'hard', score, description: '읽기 어려움' }
    }
  },

  /**
   * Generate SEO-friendly slug from text
   */
  generateSlug: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w가-힣\s-]/g, '') // Remove special characters except Korean, alphanumeric, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  },

  /**
   * Count specific markdown elements
   */
  countElements: (content: string) => {
    const headings = (content.match(/^#{1,6}\s/gm) || []).length
    const links = (content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length
    const images = (content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
    const inlineCode = (content.match(/`[^`]+`/g) || []).length
    const lists = (content.match(/^(\s*[-*+]\s|\s*\d+\.\s)/gm) || []).length
    const blockquotes = (content.match(/^>\s/gm) || []).length
    const tables = (content.match(/\|.*\|/g) || []).length

    return {
      headings,
      links,
      images,
      codeBlocks,
      inlineCode,
      lists,
      blockquotes,
      tables,
      total: headings + links + images + codeBlocks + inlineCode + lists + blockquotes + tables
    }
  }
}