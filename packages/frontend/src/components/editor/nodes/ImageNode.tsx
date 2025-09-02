import type { JSX } from 'react'
import { DecoratorNode, type DOMExportOutput, type LexicalNode, type NodeKey, type SerializedLexicalNode } from 'lexical'

export type SerializedImageNode = SerializedLexicalNode & {
  type: 'image'
  version: 1
  src: string
  alt?: string
  width?: number
  height?: number
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __alt: string | undefined
  __width: number | undefined
  __height: number | undefined

  static override getType(): string {
    return 'image'
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__width, node.__height, node.__key)
  }

  constructor(src: string, alt?: string, width?: number, height?: number, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__alt = alt ?? undefined
    this.__width = width ?? undefined
    this.__height = height ?? undefined
  }

  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, alt, width, height } = serializedNode
    const payload: { src: string; alt?: string; width?: number; height?: number } = { src }

    if (alt !== undefined) {
      payload.alt = alt
    }

    if (width !== undefined) {
      payload.width = width
    }

    if (height !== undefined) {
      payload.height = height
    }

    return $createImageNode(payload)
  }

  override exportJSON(): SerializedImageNode {
    const base: SerializedImageNode = {
      type: 'image',
      version: 1,
      src: this.__src,
    }

    if (this.__alt !== undefined) {
      base.alt = this.__alt
    }

    if (this.__width !== undefined) {
      base.width = this.__width
    }

    if (this.__height !== undefined) {
      base.height = this.__height
    }

    return base
  }

  override createDOM(): HTMLElement {
    const span = document.createElement('span')

    return span
  }

  override updateDOM(): false {
    return false
  }

  override decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__alt ?? ''}
        width={this.__width}
        height={this.__height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    )
  }

  // Provide HTML export for $generateHtmlFromNodes
  override exportDOM(): DOMExportOutput {
    const img = document.createElement('img')

    img.setAttribute('src', this.__src)

    if (this.__alt) {
      img.setAttribute('alt', this.__alt)
    }

    if (this.__width) {
      img.setAttribute('width', String(this.__width))
    }

    if (this.__height) {
      img.setAttribute('height', String(this.__height))
    }

    return { element: img }
  }
}

export function $createImageNode({ src, alt, width, height }: { src: string; alt?: string; width?: number; height?: number }) {
  return new ImageNode(src, alt, width, height)
}

export function $isImageNode(node?: LexicalNode): node is ImageNode {
  return node instanceof ImageNode
}
