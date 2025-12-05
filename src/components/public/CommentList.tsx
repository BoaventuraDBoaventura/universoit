import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommentForm } from "./CommentForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Reply, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  replies?: Comment[];
}

interface CommentListProps {
  articleId: string;
}

export function CommentList({ articleId }: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: comments, isLoading, refetch } = useQuery({
    queryKey: ["comments", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, author_name, content, created_at, parent_id")
        .eq("article_id", articleId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
  });

  // Organize comments into tree structure
  const organizeComments = (comments: Comment[]): Comment[] => {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    comments.forEach((comment) => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment) => {
      const node = map.get(comment.id)!;
      if (comment.parent_id && map.has(comment.parent_id)) {
        map.get(comment.parent_id)!.replies!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const handleCommentSuccess = () => {
    setReplyingTo(null);
    refetch();
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
      addSuffix: true,
      locale: pt,
    });

    return (
      <div className={depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}>
        <div className="rounded-lg bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <span className="font-medium">{comment.author_name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          <p className="mb-3 text-sm leading-relaxed">{comment.content}</p>
          {depth < 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-muted-foreground"
            >
              <Reply className="mr-1 h-3 w-3" />
              Responder
            </Button>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="mt-4 ml-8">
            <CommentForm
              articleId={articleId}
              parentId={comment.id}
              onSuccess={handleCommentSuccess}
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const organizedComments = comments ? organizeComments(comments) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-display text-xl font-semibold">
          Comentários ({comments?.length || 0})
        </h3>
      </div>

      {/* Comment Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 font-medium">Deixe o seu comentário</h4>
        <CommentForm articleId={articleId} onSuccess={handleCommentSuccess} />
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : organizedComments.length > 0 ? (
        <div className="space-y-4">
          {organizedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Ainda não há comentários. Seja o primeiro a comentar!
          </p>
        </div>
      )}
    </div>
  );
}