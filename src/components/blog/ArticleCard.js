import Link from 'next/link';
import { formatDate } from '../../utils/date';

export default function ArticleCard({ post }) {
    const category = post.categories ? post.categories.name : null;
    const imageUrl = post.featured_image_url || '/images/default-blog.jpg';

    return (
        <article className="flex flex-col bg-card rounded-2xl overflow-hidden border border-default hover:border-gray-700 transition-all duration-300 hover:scale-[1.02] group">
            <Link href={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden bg-tertiary">
                <img
                    src={imageUrl}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&q=80&w=800'; // Fallback
                    }}
                />
                {category && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/10">
                            {category}
                        </span>
                    </div>
                )}
            </Link>

            <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center gap-x-4 text-xs text-secondary mb-3">
                    <time dateTime={post.published_at}>
                        {formatDate(post.published_at || post.created_at)}
                    </time>
                </div>

                <h3 className="text-xl font-heading font-semibold leading-tight text-primary mb-3 group-hover:text-accent-light transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                        {post.title}
                    </Link>
                </h3>

                <p className="mt-auto text-sm leading-relaxed text-secondary line-clamp-3">
                    {post.excerpt}
                </p>
            </div>
        </article>
    );
}
