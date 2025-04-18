-- Insert a real full article blog post into the posts table

INSERT INTO posts (
  id,
  title,
  slug,
  content,
  excerpt,
  featured_image_url,
  status,
  published_at,
  category_id,
  author_id,
  meta_title,
  meta_description,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'The Ultimate Guide to Boosting Your Productivity',
  'ultimate-guide-boosting-productivity',
  '<p>In today\'s fast-paced world, productivity is key to success. This comprehensive guide will walk you through proven strategies to maximize your efficiency and achieve your goals.</p>
   <h2>1. Prioritize Your Tasks</h2>
   <p>Start each day by identifying your most important tasks. Use techniques like the Eisenhower Matrix to focus on what truly matters.</p>
   <h2>2. Eliminate Distractions</h2>
   <p>Turn off notifications, create a dedicated workspace, and set specific times to check emails and messages.</p>
   <h2>3. Use Time Management Techniques</h2>
   <p>Methods like Pomodoro, time blocking, and batching similar tasks can help maintain focus and momentum.</p>
   <h2>4. Take Regular Breaks</h2>
   <p>Short breaks improve concentration and prevent burnout. Step away from your desk, stretch, or take a walk.</p>
   <h2>5. Leverage Technology</h2>
   <p>Use productivity apps and tools to organize tasks, set reminders, and track progress.</p>
   <p>By implementing these strategies, you can significantly enhance your productivity and work smarter, not harder.</p>',
  'Discover proven strategies to boost your productivity and achieve your goals with this ultimate guide.',
  'https://example.com/images/productivity-guide.jpg',
  'published',
  NOW(),
  (SELECT id FROM categories WHERE slug = 'productivity' LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'Ultimate Guide to Boosting Productivity',
  'Learn how to maximize your efficiency with our comprehensive productivity guide.',
  NOW(),
  NOW()
);