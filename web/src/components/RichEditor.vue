<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Node, mergeAttributes } from '@tiptap/core'
import { upload } from '../api'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'update:text', v: string): void
}>()

const SpoilerImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      spoiler: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-spoiler') === '1',
        renderHTML: (attrs: Record<string, any>) =>
          attrs.spoiler ? { 'data-spoiler': '1', class: 'img-spoiler' } : {},
      },
    }
  },
})

const VideoBlock = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, poster: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'video' }]
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      'video',
      mergeAttributes({ controls: 'true', preload: 'metadata', class: 'ed-video' }, HTMLAttributes),
    ]
  },
})

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
    TextStyle,
    Color,
    SpoilerImage.configure({ inline: false }),
    VideoBlock,
    Placeholder.configure({
      placeholder: '写点什么…可以加粗、下划线、图片、视频，也可以直接贴链接。',
    }),
  ],
  editorProps: {
    attributes: { class: 'rte-content' },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
    emit('update:text', editor.getText())
  },
})

watch(
  () => props.modelValue,
  (v) => {
    const cur = editor.value?.getHTML() || ''
    if (v !== cur) editor.value?.commands.setContent(v || '', { emitUpdate: false })
  },
)

const colors = [
  '#16150f', '#5f5a50', '#a8432f', '#d96b2f', '#c9a227',
  '#3e8c5f', '#3e5c4b', '#2f6f8f', '#3b5bdb', '#7048b6',
  '#b8386f', '#8a5a2b',
]

const emojis = [
  '😀', '😄', '😁', '😆', '😅', '😂', '🙂', '😉', '😊', '😍',
  '🤔', '😐', '😴', '😎', '🤯', '😢', '😭', '😡', '🥺', '😇',
  '👍', '👎', '👏', '🙏', '💪', '🤝', '✌️', '👌', '🫡', '👀',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💯',
  '🔥', '✨', '🎉', '🎊', '⭐', '🌟', '✅', '❌', '⚠️', '📌',
  '🔗', '📷', '🎬', '🎵', '☕', '🍚', '🐶', '🐱', '🌸', '🌙',
]

const colorOpen = ref(false)
const emojiOpen = ref(false)
const linkOpen = ref(false)
const linkUrl = ref('')
const busy = ref('')
const note = ref('')
const imgInput = ref<HTMLInputElement | null>(null)
const vidInput = ref<HTMLInputElement | null>(null)

function toggleHTML() {
  colorOpen.value = false
  emojiOpen.value = false
  linkOpen.value = false
}

function setColor(c: string) {
  editor.value?.chain().focus().setColor(c).run()
  colorOpen.value = false
}

function addEmoji(e: string) {
  editor.value?.chain().focus().insertContent(e).run()
}

function openLink() {
  const prev = (editor.value?.getAttributes('link') as any)?.href || ''
  linkUrl.value = prev
  linkOpen.value = true
  emojiOpen.value = false
  colorOpen.value = false
}

function applyLink() {
  const v = linkUrl.value.trim()
  if (!editor.value) return
  if (!v) {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    const href = /^https?:\/\//i.test(v) ? v : 'https://' + v
    editor.value.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }
  linkOpen.value = false
}

function pickImg() {
  imgInput.value?.click()
}

function pickVid() {
  vidInput.value?.click()
}

async function onImage(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  input.value = ''
  if (!f) return
  note.value = ''
  busy.value = '正在上传图片…'
  const fd = new FormData()
  fd.append('file', f)
  const r = await upload<{ url: string }>('/api/upload/image', fd)
  busy.value = ''
  if (!r.ok || !r.data) {
    note.value = r.msg || '图片上传失败'
    return
  }
  editor.value?.chain().focus().setImage({ src: r.data.url, alt: f.name }).run()
}

async function onVideo(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  input.value = ''
  if (!f) return
  note.value = ''
  busy.value = '正在上传视频，大文件会久一点…'
  const fd = new FormData()
  fd.append('file', f)
  const r = await upload<{ url: string }>('/api/upload/video', fd)
  busy.value = ''
  if (!r.ok || !r.data) {
    note.value = r.msg || '视频上传失败'
    return
  }
  editor.value
    ?.chain()
    .focus()
    .insertContent({ type: 'videoBlock', attrs: { src: r.data.url } })
    .run()
}

function toggleSpoiler() {
  if (!editor.value?.isActive('image')) {
    note.value = '先点一下帖子里的图片，再选择是否遮挡'
    return
  }
  const s = (editor.value.getAttributes('image') as any).spoiler
  editor.value.chain().focus().updateAttributes('image', { spoiler: !s }).run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({
  getHTML: () => editor.value?.getHTML() || '',
  getText: () => editor.value?.getText() || '',
  clear: () => editor.value?.commands.setContent('', { emitUpdate: false }),
})
</script>

<template>
  <div class="rte">
    <div class="rte-bar" v-if="editor">
      <button type="button" :class="{ on: editor.isActive('bold') }" title="加粗" @click="toggleHTML(); editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" :class="{ on: editor.isActive('italic') }" title="斜体" @click="toggleHTML(); editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" :class="{ on: editor.isActive('underline') }" title="下划线" @click="toggleHTML(); editor.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <button type="button" :class="{ on: editor.isActive('strike') }" title="删除线" @click="toggleHTML(); editor.chain().focus().toggleStrike().run()"><s>S</s></button>
      <span class="rte-sep"></span>
      <button type="button" :class="{ on: editor.isActive('heading', { level: 2 }) }" title="大标题" @click="toggleHTML(); editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="{ on: editor.isActive('heading', { level: 3 }) }" title="小标题" @click="toggleHTML(); editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <button type="button" :class="{ on: editor.isActive('bulletList') }" title="列表" @click="toggleHTML(); editor.chain().focus().toggleBulletList().run()">• 列表</button>
      <button type="button" :class="{ on: editor.isActive('orderedList') }" title="编号" @click="toggleHTML(); editor.chain().focus().toggleOrderedList().run()">1. 编号</button>
      <button type="button" :class="{ on: editor.isActive('blockquote') }" title="引用" @click="toggleHTML(); editor.chain().focus().toggleBlockquote().run()">引用</button>
      <button type="button" :class="{ on: editor.isActive('codeBlock') }" title="代码" @click="toggleHTML(); editor.chain().focus().toggleCodeBlock().run()">代码</button>
      <span class="rte-sep"></span>
      <div class="rte-pop-wrap">
        <button type="button" :class="{ on: colorOpen }" title="文字颜色" @click.stop="toggleHTML(); colorOpen = !colorOpen"><span class="c-dot"></span>颜色</button>
        <div v-if="colorOpen" class="rte-pop colors">
          <button v-for="c in colors" :key="c" type="button" class="c-btn" :style="{ background: c }" @click="setColor(c)"></button>
          <button type="button" class="c-reset" @click="editor.chain().focus().unsetColor().run(); colorOpen = false">默认</button>
        </div>
      </div>
      <div class="rte-pop-wrap">
        <button type="button" :class="{ on: emojiOpen }" title="表情" @click.stop="toggleHTML(); emojiOpen = !emojiOpen">表情</button>
        <div v-if="emojiOpen" class="rte-pop emojis">
          <button v-for="e in emojis" :key="e" type="button" class="e-btn" @click="addEmoji(e)">{{ e }}</button>
        </div>
      </div>
      <div class="rte-pop-wrap">
        <button type="button" :class="{ on: linkOpen || editor.isActive('link') }" title="链接" @click.stop="openLink">链接</button>
        <div v-if="linkOpen" class="rte-pop link-pop">
          <input v-model="linkUrl" type="text" placeholder="https://…" @keydown.enter.prevent="applyLink" />
          <button type="button" class="ok" @click="applyLink">确定</button>
          <button type="button" @click="editor.chain().focus().extendMarkRange('link').unsetLink().run(); linkOpen = false">移除</button>
        </div>
      </div>
      <button type="button" title="上传图片" @click="toggleHTML(); pickImg()">图片</button>
      <button type="button" title="上传视频" @click="toggleHTML(); pickVid()">视频</button>
      <button type="button" title="遮挡选中图片" @click="toggleHTML(); toggleSpoiler()">遮挡</button>
      <span class="rte-sep"></span>
      <button type="button" title="撤销" @click="editor.chain().focus().undo().run()">↺</button>
      <button type="button" title="重做" @click="editor.chain().focus().redo().run()">↻</button>
    </div>

    <EditorContent :editor="editor" />

    <div v-if="busy || note" class="rte-note" :class="{ err: note }">{{ busy || note }}</div>
    <input ref="imgInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden-input" @change="onImage" />
    <input ref="vidInput" type="file" accept="video/mp4,video/webm" class="hidden-input" @change="onVideo" />
  </div>
</template>

<style scoped>
.rte {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  overflow: visible;
}
.rte-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  background: #fcfbf8;
  border-radius: 10px 10px 0 0;
}
.rte-bar button {
  border: 1px solid transparent;
  background: transparent;
  color: #5f5a50;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.4;
}
.rte-bar button:hover {
  background: #f1ede5;
}
.rte-bar button.on {
  background: #eae6dc;
  color: var(--accent);
  border-color: #ddd6c9;
}
.rte-sep {
  width: 1px;
  height: 18px;
  background: var(--line);
  margin: 0 4px;
}
.rte-pop-wrap {
  position: relative;
}
.rte-pop {
  position: absolute;
  top: 34px;
  left: 0;
  z-index: 30;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(38, 34, 28, 0.12);
  padding: 10px;
}
.colors {
  display: grid;
  grid-template-columns: repeat(6, 24px);
  gap: 8px;
  width: max-content;
}
.c-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  padding: 0;
}
.c-reset {
  grid-column: 1 / -1;
  font-size: 12px;
  border: 1px solid var(--line) !important;
  padding: 4px 8px !important;
}
.c-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0483b, #3b5bdb, #3e8c5f);
  margin-right: 4px;
  vertical-align: -1px;
}
.emojis {
  display: grid;
  grid-template-columns: repeat(10, 28px);
  gap: 2px;
}
.e-btn {
  width: 28px !important;
  height: 28px;
  padding: 0 !important;
  font-size: 16px !important;
}
.link-pop {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 320px;
}
.link-pop input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  outline: none;
}
.link-pop .ok {
  background: var(--accent);
  color: #fff;
  border-radius: 6px;
  padding: 6px 10px;
}
.hidden-input {
  display: none;
}
.rte-note {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--muted);
  border-top: 1px dashed var(--line);
}
.rte-note.err {
  color: #b4432f;
}
:deep(.rte-content) {
  min-height: 280px;
  max-height: 560px;
  overflow-y: auto;
  padding: 16px 18px;
  font-size: 15px;
  line-height: 1.75;
  outline: none;
}
:deep(.rte-content p) {
  margin: 0 0 10px;
}
:deep(.rte-content h2) {
  font-size: 21px;
  margin: 18px 0 8px;
}
:deep(.rte-content h3) {
  font-size: 17px;
  margin: 14px 0 6px;
}
:deep(.rte-content ul),
:deep(.rte-content ol) {
  padding-left: 22px;
  margin: 0 0 10px;
}
:deep(.rte-content blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
  color: var(--muted);
  margin: 0 0 10px;
}
:deep(.rte-content pre) {
  background: #f4f1ea;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-size: 13px;
}
:deep(.rte-content a) {
  color: #2b5cad;
  text-decoration: underline;
  text-underline-offset: 2px;
}
:deep(.rte-content img) {
  max-width: 100%;
  border-radius: 8px;
  display: block;
  margin: 8px 0;
}
:deep(.rte-content img.img-spoiler) {
  filter: blur(16px);
  cursor: zoom-in;
}
:deep(.rte-content video) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
  background: #000;
}
:deep(.rte-content p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #b0a99c;
  pointer-events: none;
  height: 0;
}
</style>
