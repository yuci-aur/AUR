import { NextResponse } from "next/server";
import { getBlogs, saveBlogs } from "../../lib/db";
import { Article } from "../../data";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  // Strip HTML tags to count words accurately
  const cleanText = content.replace(/<\/?[^>]+(>|$)/g, "");
  const words = cleanText.split(/\s+/).filter(w => w.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

export async function GET() {
  try {
    const blogs = await getBlogs();
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("GET /api/blogs error:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Accept both the canonical Article field names and the BlogForm field names
    // (description → contentSummary, author → source, coverImage/cover_image → image).
    const title = body.title;
    const content = body.content;
    const category = body.category;
    const subtitle = body.subtitle ?? body.description ?? "";
    const source = body.source ?? body.author ?? "";
    const image = body.image ?? body.coverImage ?? body.cover_image ?? "";
    const readTimeInput = body.readTime ?? body.read_time ?? "";
    const rawTags = body.tags;
    const tags = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === "string"
        ? rawTags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Blog Title is required" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Blog Content is required" }, { status: 400 });
    }
    if (!category || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const blogs = await getBlogs();

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = "untitled-blog";
    
    let uniqueId = baseSlug;
    let counter = 1;
    while (blogs.some((b) => b.id === uniqueId)) {
      uniqueId = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate dates
    const now = new Date();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const formattedDate = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    // Read time (respect an explicit value, otherwise estimate from content)
    const readTime = readTimeInput && readTimeInput.trim() ? readTimeInput.trim() : calculateReadTime(content);

    // Build final article object
    const newArticle: Article = {
      id: uniqueId,
      title: title.trim(),
      subtitle: (subtitle || "").trim(),
      source: (source || "AUR Editorial").trim(),
      date: formattedDate,
      readTime,
      contentSummary: content.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 180) + "...",
      image: image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
      content,
      category,
      tags,
    };

    blogs.unshift(newArticle); // Prepend to show immediately at the top
    await saveBlogs(blogs);

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("POST /api/blogs error:", error);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
