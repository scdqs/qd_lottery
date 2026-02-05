---
name: nextjs-react-dev
description: 精通 Next.js、React 应用开发，当涉及这两个框架的代码编写时需要使用该 SKILL。
---

你是一名资深的前端开发工程师，精通 NextJS@16、React@19、Zustand、TanstackQuery、Motion 等框架的最佳实践，能开发出最优雅、最逻辑完善、可维护性最强的代码。

## 一、 必须做 (Must Do)

### 1. 异步路由与 React 19 核心

#### 1.1 异步 Params 处理

```tsx
// ✅ 正确：Next.js 16 异步 params 处理
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ query?: string }>
}) {
  const { id } = await params
  const { query } = await searchParams
  // 或使用 use() hook
  // const { id } = use(params)
}

// ❌ 错误：直接解构
export default function Page({ params }) {
  const { id } = params // TypeError!
}
```

#### 1.2 React Compiler 与手动优化边界

```tsx
// ✅ React Compiler 自动处理简单场景
function Component({ data }) {
  const filtered = data.filter((item) => item.active) // 编译器自动优化
  return <List items={filtered} />
}

// ✅ 仅在以下场景手动优化：
// 1. 复杂计算（如深度递归、大数据集处理）
const expensiveValue = useMemo(() => {
  return deepRecursiveCalculation(largeDataset)
}, [largeDataset])

// 2. 编译器显式报错或性能瓶颈
// 3. 需要跨多层传递的稳定引用
const stableCallback = useCallback(() => {
  api.submit(formData)
}, [formData])
```

#### 1.3 SEO 与静态生成

```tsx
// app/products/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await fetchProduct(id)

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.imageUrl],
    },
  }
}

export async function generateStaticParams() {
  const products = await fetchAllProducts()
  return products.map((p) => ({ id: p.id }))
}
```

---

### 2. 性能与资源优化

#### 2.1 Image 组件完整使用规范

```tsx
// ✅ 标准图片
<Image
  src="/image.jpg"
  alt="描述"
  width={800} // 图片实际宽高，便于生成响应式图片
  height={600}
  priority // 首屏关键图片
  quality={85} // 默认 75，可调整
/>

// ✅ 背景图实现
<div className="relative h-[400px] w-full">
  <Image
    src="/hero.jpg"
    alt="背景"
    fill
    className="object-cover object-center"
    priority
    sizes="100vw" // 响应式尺寸提示
  />
  <div className="relative z-10">{/* 前景内容 */}</div>
</div>

// ✅ 响应式图片
<Image
  src="/responsive.jpg"
  alt="响应式"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

#### 2.2 字体加载最佳实践

```tsx
// app/layout.tsx
import { Inter, Noto_Sans_SC } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // 避免 FOIT
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-sc',
})

const customFont = localFont({
  src: './fonts/MyFont.woff2',
  variable: '--font-custom',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${notoSansSC.variable} ${customFont.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}

// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        'sans-sc': ['var(--font-noto-sans-sc)'],
        custom: ['var(--font-custom)'],
      },
    },
  },
}
```

#### 2.3 Link 预加载控制

```tsx
// ✅ 默认自动预加载可视区域链接
<Link href="/about">About</Link>

// ✅ 禁用预加载（动态路由或低优先级页面）
<Link href="/admin" prefetch={false}>Admin</Link>

// ✅ 编程式导航
'use client'
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/dashboard') // 自动预加载
router.prefetch('/settings') // 手动预加载
```

---

### 3. 严格分层结构

#### 3.1 文件组织规范

```
app/
├── dashboard/
│   ├── _components/       # 私有组件（仅 dashboard 使用）
│   │   ├── ui.tsx         # UI 与逻辑分离，可以继续拆分为多个组件
│   │   └── feature.tsx    # 模块复杂时，分层设计，拆分为不同的组件处理不同的事项
│   ├── _apis/             # 私有 API 逻辑
│   │   ├── actions.ts     # Server Actions（如需要）
│   │   ├── queries.ts     # 数据查询函数
│   │   └── mutations.ts   # 数据变更函数，简单时可合并至 queries
│   ├── _assets/           # 私有静态资源
│   │   ├── chart-bg.webp
│   │   └── icons/
│   ├── _hooks/            # 私有 Hooks
│   │   └── useRealtime.ts
│   ├── _utils/            # 私有工具函数
│   │   └── formatData.ts
│   ├── layout.tsx
│   └── page.tsx           # 模块分层设计，不得将大量代码堆积至 page
├── _components/           # 全局共享组件
│   ├── Header.tsx
│   └── Footer.tsx
└── _lib/                  # 全局共享逻辑
    ├── db.ts
    └── auth.ts
```

#### 3.2 导入路径规则

```tsx
// ✅ 正确：使用相对路径引用私有资源

// ❌ 错误：跨路由引用私有资源
import { Chart } from '@/app/other-route/_components/Chart' // 禁止！

// ✅ 正确：使用别名引用全局资源
import { Header } from '@/components/Header'
import { db } from '@/lib/db'

import heroBg from './_assets/hero.webp'
import { Chart } from './_components/ui/Chart'
```

---

## 二、 推荐做 (Recommended)

### 1. 数据请求混合策略 (Hybrid Data Fetching)

#### 1.1 服务端数据获取 (RSC)

```tsx
import { revalidateTag } from 'next/cache'

// app/posts/page.tsx (默认 Server Component)
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: {
      revalidate: 3600, // ISR: 1小时重新验证
      tags: ['posts'], // 按需重新验证标签
    },
  })
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()
  return <PostList posts={posts} />
}

// 按需重新验证
// app/_apis/actions.ts
;('use server')

export async function createPost(formData: FormData) {
  await db.posts.create(/* ... */)
  revalidateTag('posts') // 触发重新验证
}
```

#### 1.2 客户端交互数据 (TanStack Query)

```tsx
// app/posts/_components/SearchPosts.tsx
'use client'

import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
// app/posts/page.tsx
import { Suspense } from 'react'

export function SearchPosts() {
  const queryClient = useQueryClient()

  // ✅ 使用 Suspense（配合父组件的 <Suspense>）
  const { data: posts } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
  })

  // ✅ 搜索等交互式查询（不使用 Suspense）
  const [searchTerm, setSearchTerm] = useState('')
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['posts', 'search', searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: searchTerm.length > 2, // 条件查询
    staleTime: 2 * 60 * 1000,
  })

  // ✅ 乐观更新
  const mutation = useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previous = queryClient.getQueryData(['posts'])
      queryClient.setQueryData(['posts'], (old) =>
        old.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
      )
      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <>
      <input onChange={(e) => setSearchTerm(e.target.value)} />
      {isLoading ? <Spinner /> : <Results data={searchResults} />}
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchPosts />
    </Suspense>
  )
}
```

---

### 2. 状态管理策略

#### 2.1 Context：低频全局状态

```tsx
// app/_components/providers/ThemeProvider.tsx
'use client'

import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
} | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

#### 2.2 Zustand：高频复杂状态

```typescript
// app/_store/useCartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface CartItem {
  id: string
  quantity: number
  price: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  // 计算属性通过 selector 实现
}

export const useCartStore = create<CartStore>()(
  persist(
    immer((set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.id === item.id)
        if (existing) {
          existing.quantity += item.quantity
        } else {
          state.items.push(item)
        }
      }),
      removeItem: (id) => set((state) => {
        state.items = state.items.filter(i => i.id !== id)
      }),
      clearCart: () => set({ items: [] }),
    })),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// 派生状态 selectors
export const selectTotalItems = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)

export const selectTotalPrice = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

// ✅ 组件使用：必须使用 selector
function CartButton() {
  const totalItems = useCartStore(selectTotalItems) // 仅在 totalItems 变化时重渲染
  return <button>Cart ({totalItems})</button>
}

// ✅ 多个状态
function CartSummary() {
  const { totalItems, totalPrice } = useCartStore(
    (state) => ({
      totalItems: selectTotalItems(state),
      totalPrice: selectTotalPrice(state),
    })
  )
  return <div>{totalItems} items - ${totalPrice}</div>
}

// ❌ 错误：无 selector
function BadComponent() {
  const store = useCartStore() // 任何状态变化都会重渲染！
  return <div>{store.items.length}</div>
}
```

#### 2.3 状态选择决策树

```
数据来源？
├─ 服务端初始数据 → Server Component + fetch
├─ 交互式/实时数据 → TanStack Query
└─ UI 状态？
    ├─ 组件内部 → useState
    ├─ 跨少量组件 → props drilling / Context
    ├─ 全局低频（主题/语言） → Context
    └─ 全局高频/复杂逻辑 → Zustand
```

---

### 3. CSS 与动画

#### 3.2 Motion 动画

```tsx
'use client'

import { AnimatePresence, motion } from 'motion'

// ✅ 基础动画
export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

// ✅ 列表动画
export function StaggerList({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {items.map((item) => (
        <motion.li
          key={item}
          variants={{
            hidden: { opacity: 0, x: -20 },
            show: { opacity: 1, x: 0 },
          }}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  )
}

// ✅ 条件渲染动画
export function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg bg-white p-6"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## 三、 禁止做 (Forbidden)

### 1. ❌ RSC 中混入客户端逻辑

```tsx
// app/page.tsx
import { Counter } from './_components/Counter'

// ❌ 错误：Server Component 使用客户端 API
export default function Page() {
  const [count, setCount] = useState(0) // ❌ Error!

  return <button onClick={() => setCount(count + 1)}>Click</button> // ❌ Error!
}

// ✅ 正确：拆分为 Client Component
;('use client')
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

export default function Page() {
  return <Counter />
}
```

### 2. ❌ 使用原生 HTML 资源标签

```tsx
// ❌ 错误
<img src="/image.jpg" alt="Image" />
<link rel="stylesheet" href="/styles.css" />
<script src="/analytics.js"></script>

// ✅ 正确
import Image from 'next/image'
import Script from 'next/script'
import { Inter } from 'next/font/google'

<Image src="/image.jpg" alt="Image" width={800} height={600} />
<Script src="https://analytics.com/script.js" strategy="afterInteractive" />
```

### 3. ❌ 无 Selector 的 Zustand 使用

```tsx
// ❌ 错误：引用整个 store
const store = useStore()
return <div>{store.user.name}</div> // 任何状态变化都重渲染

// ✅ 正确：使用 selector
const userName = useStore((state) => state.user.name)
return <div>{userName}</div> // 仅 user.name 变化时重渲染
```

### 4. ❌ 手动管理表单 Loading 状态

```tsx
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

// ❌ 错误：手动 useState
const [isLoading, setIsLoading] = useState(false)
const handleSubmit = async () => {
  setIsLoading(true)
  await submitForm()
  setIsLoading(false)
}

// ✅ 正确：使用 React 19 Actions
;('use client')

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? 'Submitting...' : 'Submit'}</button>
}

export function Form() {
  const [state, formAction] = useActionState(submitAction, null)

  return (
    <form action={formAction}>
      <input name="email" />
      <SubmitButton />
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  )
}
```

### 5. ❌ 直接操作 DOM

```tsx
// ❌ 错误
useEffect(() => {
  document.getElementById('modal').style.display = 'block'
}, [])

// ✅ 正确：使用 React 状态
const [isOpen, setIsOpen] = useState(false)
return isOpen && <Modal />
```

---

## 五、 性能优化清单

### 5.1 图片优化

- [ ] 所有图片使用 `next/image`
- [ ] 首屏关键图片添加 `priority`
- [ ] 设置合适的 `sizes` 属性
- [ ] 使用 WebP/AVIF 格式
- [ ] 大图使用 `placeholder="blur"`

### 5.2 代码分割

- [ ] 动态导入非关键组件

```tsx
const HeavyComponent = dynamic(() => import('./_components/Heavy'), {
  loading: () => <Spinner />,
  ssr: false, // 仅客户端渲染
})
```

### 5.3 数据获取

- [ ] 服务端数据设置合理的 `revalidate`
- [ ] TanStack Query 配置 `staleTime`
- [ ] 使用 `

## 资源

- [Next.js](https://nextjs.org/docs/llms.txt)
- [React](https://react.dev/reference/react)
- [Zustand](https://github.com/pmndrs/zustand/blob/main/docs/llms.txt)
- [TanstackQuery](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Motion](https://motion.dev/docs/react)
