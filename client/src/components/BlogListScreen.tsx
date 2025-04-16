import { BlogArticle } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import HelpModal from "./HelpModal";

interface BlogListScreenProps {
  onBack: () => void;
  onSelectArticle: (slug: string) => void;
}

export default function BlogListScreen({ onBack, onSelectArticle }: BlogListScreenProps) {
  // Fetch blog articles from API
  const { data: articles = [], isLoading } = useQuery<BlogArticle[]>({
    queryKey: ['/api/blog-articles'],
  });

  const helpInstructions = `
This screen displays our blog with articles for figure models.

Features:
• Featured Article section highlights our most important content
• Latest Articles section shows all other published articles
• Click on any article to read its full content
• Articles are tagged by topic for easy reference

Tips:
• Articles provide valuable information about posing techniques, model health, and tips for successful sessions
• Use the Back button to return to the main menu
• Click "Read Article →" on any card to view the full article
`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl relative">
      {/* Standalone Help Button */}
      <div className="absolute right-16 top-8 z-10">
        <HelpModal 
          title="Model Blog Help" 
          instructions={helpInstructions}
        />
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold">Model Blog</h1>
        </div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">No articles found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured article (if any) */}
          {articles.find(article => article.featured === 1) && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Featured Article</h2>
              {renderFeaturedArticle(articles.find(article => article.featured === 1)!)}
            </div>
          )}

          {/* Regular articles */}
          <h2 className="text-xl font-semibold mb-4">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles
              .filter(article => article.featured !== 1)
              .map(article => renderArticleCard(article))}
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to render the featured article
  function renderFeaturedArticle(article: BlogArticle) {
    return (
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onSelectArticle(article.slug)}
      >
        {article.coverImage && (
          <div className="h-64 overflow-hidden">
            <img 
              src={article.coverImage} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-2">{article.title}</h3>
          <p className="text-gray-600 mb-4 text-sm">
            By {article.authorName} • {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
          </p>
          <p className="text-gray-700 mb-4">{article.summary}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags && article.tags.map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <button 
            className="text-blue-600 font-medium hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onSelectArticle(article.slug);
            }}
          >
            Read Article →
          </button>
        </div>
      </div>
    );
  }

  // Helper function to render an article card
  function renderArticleCard(article: BlogArticle) {
    return (
      <div 
        key={article.id} 
        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onSelectArticle(article.slug)}
      >
        {article.coverImage && (
          <div className="h-40 overflow-hidden">
            <img 
              src={article.coverImage} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2">{article.title}</h3>
          <p className="text-gray-600 mb-3 text-xs">
            By {article.authorName} • {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
          </p>
          <p className="text-gray-700 mb-3 line-clamp-2">{article.summary}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {article.tags && article.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <button 
            className="text-blue-600 text-sm font-medium hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onSelectArticle(article.slug);
            }}
          >
            Read Article →
          </button>
        </div>
      </div>
    );
  }
}