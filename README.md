This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Cloudflare Images Integration Instructions

This project integrates Cloudflare Images for image hosting and delivery. Follow these steps to set up and configure Cloudflare Images in your Next.js project.

## 1. Set up a Cloudflare Account and Enable Cloudflare Images

- Sign up or log in to your Cloudflare account at [https://dash.cloudflare.com/](https://dash.cloudflare.com/).
- Select your site or create a new one.
- Navigate to the **Images** section in the Cloudflare dashboard.
- Enable **Cloudflare Images** for your account.
- Note your **Account ID** from the dashboard (found in the Images section or under your profile).

## 2. Configure API Keys and Environment Variables

- Create an API Token with permissions to manage Cloudflare Images:
  - Go to **My Profile > API Tokens**.
  - Click **Create Token**.
  - Use the **Edit Cloudflare Images** template or create a custom token with:
    - Account Images: Edit
  - Save the token securely.

- Add the following environment variables to your `.env.local` file in the project root:

```
NEXT_PUBLIC_CF_ACCOUNT_ID=your_cloudflare_account_id
CF_API_TOKEN=your_cloudflare_api_token
NEXT_PUBLIC_CF_IMAGES_BASE_URL=https://imagedelivery.net/your_account_hash/
```

- Replace `your_cloudflare_account_id`, `your_cloudflare_api_token`, and `your_account_hash` with your actual Cloudflare account details.

## 3. Update Image Upload Logic

- The project upload functions will be updated to upload images directly to Cloudflare Images using the API token.
- Uploaded images will return an image ID used to construct delivery URLs.

## 4. Update Image Retrieval URLs

- Image URLs will be constructed using the base URL from `NEXT_PUBLIC_CF_IMAGES_BASE_URL` combined with the image ID and optional transformations.
- Example URL format: `https://imagedelivery.net/{account_hash}/{image_id}/public`

## 5. Security and Efficiency

- Keep your `CF_API_TOKEN` secret and do not expose it to the client.
- Use environment variables to manage sensitive keys.
- Use server-side API routes or service functions to handle image uploads securely.
- Use Cloudflare's image resizing and optimization features via URL parameters for efficient delivery.

---

For detailed API documentation, visit: https://developers.cloudflare.com/images/cloudflare-images/upload-images
