import { BlogArticle } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import HelpModal from "./HelpModal";

interface BlogArticleScreenProps {
  slug: string;
  onBack: () => void;
}

export default function BlogArticleScreen({ slug, onBack }: BlogArticleScreenProps) {
  // Fetch the article by slug
  const { data: article, isLoading, error } = useQuery<BlogArticle>({
    queryKey: [`/api/blog-articles/slug/${slug}`],
  });
  
  const helpInstructions = `
This screen shows the full content of a blog article.

Features:
• Complete article content with formatting and images
• Article metadata including author and publication date
• Topic tags for easy categorization

Navigation:
• Use the "Back to Articles" button to return to the blog list
• Use the help icon (?) for instructions on any screen

Tips:
• These articles provide helpful information for live models about posing techniques, health considerations, and industry tips
• Articles may contain specific guidance for difficult poses or pose sequencing
`;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
          <p className="mb-6">We couldn't find the article you're looking for.</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl relative">
      <div className="absolute top-8 right-4">
        <HelpModal
          title="Article View Help"
          instructions={helpInstructions}
        />
      </div>
      
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:underline"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Articles
      </button>

      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {article.coverImage && (
          <div className="h-72 overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center text-gray-600 mb-6">
            <span>By {article.authorName}</span>
            <span className="mx-2">•</span>
            <span>{format(new Date(article.publishedAt), 'MMMM d, yyyy')}</span>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
}