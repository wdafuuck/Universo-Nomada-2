import { fetchBlogPosts } from "../src/lib/blog-store";

fetchBlogPosts()
  .then((posts) => console.log(`Blog ready: ${posts.length} articles`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
