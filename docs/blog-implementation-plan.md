# Blog Implementation Plan for SEO-Focused Next.js Project

## 1. Database Schema (Supabase)

We will create the following tables in Supabase:

- **categories**
  - id (uuid, PK)
  - name (text, unique)
  - slug (text, unique)
  - description (text)
  - created_at (timestamp)
  - updated_at (timestamp)

- **tags**
  - id (uuid, PK)
  - name (text, unique)
  - slug (text, unique)
  - created_at (timestamp)
  - updated_at (timestamp)

- **posts**
  - id (uuid, PK)
  - title (text)
  - slug (text, unique)
  - content (text)
  - excerpt (text)
  - featured_image_url (text, nullable)
  - status (text: draft, published)
  - published_at (timestamp, nullable)
  - category_id (uuid, FK to categories.id)
  - author_id (uuid, FK to Supabase auth users)
  - meta_title (text, nullable)
  - meta_description (text, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)

- **posts_tags** (join table)
  - post_id (uuid, PK, FK to posts.id)
  - tag_id (uuid, PK, FK to tags.id)

- **users** (Supabase auth users table)

## 2. API Routes & Services

- Create Supabase client functions for:
  - Fetching posts (all, by slug, by category, by tag, paginated)
  - Fetching categories and tags
  - CRUD operations for posts, categories, tags (admin only)
- Implement Next.js API routes under `/api/blog/` for admin operations with authentication checks.

## 3. Frontend Pages

- `/blog` - Blog listing page with pagination and filtering.
- `/blog/[slug]` - Single post page with dynamic metadata and structured data.
- `/blog/category/[slug]` - Category archive page.
- `/blog/tag/[slug]` - Tag archive page.

Use `getStaticProps` and `getStaticPaths` for static generation.

## 4. Admin Interface

- `/admin/blog` - Dashboard listing posts with edit/delete.
- `/admin/blog/new` - Create new post form.
- `/admin/blog/edit/[id]` - Edit post form.
- `/admin/blog/categories` - Manage categories.
- `/admin/blog/tags` - Manage tags.

Protect admin routes with Supabase authentication.

## 5. SEO Enhancements

- Dynamic `<Head>` metadata for all blog pages.
- JSON-LD structured data for posts.
- Dynamic sitemap generation at `/api/sitemap.xml`.
- Proper `robots.txt` configuration.

## 6. UI Components

- `BlogPostPreview`, `BlogPostDetail`, `CategoryList`, `TagList`.
- Admin forms and tables using Tailwind CSS and React Hook Form.
- Rich text editor integration for post content.

## Implementation Steps

1. Set up Supabase tables.
2. Implement Supabase service functions.
3. Build admin UI.
4. Build public-facing blog pages.
5. Integrate SEO metadata and structured data.
6. Create sitemap generation.
7. Style with Tailwind CSS.

---

This plan ensures a comprehensive, SEO-optimized blog integrated into your existing Next.js and Supabase project.