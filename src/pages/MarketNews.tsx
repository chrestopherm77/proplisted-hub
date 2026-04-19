import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, MessageCircle, Share2, Plus, Send, ChevronDown, ChevronUp, Trash2, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsPost {
  id: string;
  user_id: string;
  title: string | null;
  image_url: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

interface NewsComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile_name?: string;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const renderContentWithLinks = (text: string) => {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:opacity-80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const MarketNews = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // New post state
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, NewsComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: postsData, error } = await supabase
        .from('news_posts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!postsData || postsData.length < PAGE_SIZE) {
        setHasMore(false);
      }

      // Fetch likes counts and user likes
      const postIds = (postsData || []).map(p => p.id);
      
      const { data: likesData } = await supabase
        .from('news_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      const { data: commentsCountData } = await supabase
        .from('news_comments')
        .select('post_id')
        .in('post_id', postIds);

      const enriched: NewsPost[] = (postsData || []).map(p => ({
        ...p,
        likes_count: (likesData || []).filter(l => l.post_id === p.id).length,
        comments_count: (commentsCountData || []).filter(c => c.post_id === p.id).length,
        user_liked: (likesData || []).some(l => l.post_id === p.id && l.user_id === user.id),
      }));

      setPosts(prev => append ? [...prev, ...enriched] : enriched);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchPosts(0);
  }, [user, fetchPosts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  const handleToggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;
    try {
      if (currentlyLiked) {
        await supabase.from('news_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('news_likes').insert({ post_id: postId, user_id: user.id });
      }
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        user_liked: !currentlyLiked,
        likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
      } : p));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleShare = (post: NewsPost) => {
    const text = post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '');
    const url = `https://wa.me/?text=${encodeURIComponent(`📰 Giro do Mercado\n\n${text}\n\nConfira em: ${window.location.href}`)}`;
    window.open(url, '_blank');
  };

  const handleToggleComments = async (postId: string) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !comments[postId]) {
      const { data } = await supabase
        .from('news_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (data) {
        // Fetch profile names
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const enriched = data.map(c => ({
          ...c,
          profile_name: profiles?.find(p => p.id === c.user_id)?.name || 'Usuário',
        }));
        setComments(prev => ({ ...prev, [postId]: enriched }));
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) return;
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const { data, error } = await supabase
        .from('news_comments')
        .insert({ post_id: postId, user_id: user.id, content })
        .select()
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const newComment: NewsComment = {
        ...data,
        profile_name: profile?.name || 'Você',
      };

      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({ title: 'Erro', description: 'Não foi possível adicionar o comentário.', variant: 'destructive' });
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newContent.trim()) return;
    setPosting(true);

    try {
      let imageUrl: string | null = null;

      if (newImage) {
        const ext = newImage.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('news-images')
          .upload(path, newImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('news_posts').insert({
        user_id: user.id,
        content: newContent.trim(),
        image_url: imageUrl,
      });

      if (error) throw error;

      toast({ title: 'Publicado!', description: 'Sua publicação foi criada com sucesso.' });
      setNewContent('');
      setNewImage(null);
      setNewPostOpen(false);
      setPage(0);
      setHasMore(true);
      fetchPosts(0);
    } catch (err) {
      console.error('Error creating post:', err);
      toast({ title: 'Erro', description: 'Não foi possível criar a publicação.', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await supabase.from('news_posts').update({ is_active: false }).eq('id', postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: 'Removido', description: 'Publicação removida com sucesso.' });
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  if (authLoading) {
    return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Giro do Mercado</h1>
          </div>
          {isAdmin && (
            <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Publicação</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Publicação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Escreva sua publicação..."
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={5}
                  />
                  <div>
                    <label className="text-sm font-medium text-foreground">Imagem (opcional)</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => setNewImage(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                  </div>
                  {newImage && (
                    <img
                      src={URL.createObjectURL(newImage)}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  )}
                  <Button onClick={handleCreatePost} disabled={posting || !newContent.trim()} className="w-full">
                    {posting ? 'Publicando...' : 'Publicar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Feed */}
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma publicação ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <Card key={post.id} className="overflow-hidden">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    className="w-full max-h-[500px] object-cover"
                    loading="lazy"
                  />
                )}
                <CardContent className="p-4 space-y-3">
                  {/* Title */}
                  {post.title && (
                    <h2 className="text-xl font-extrabold text-foreground leading-tight border-l-4 border-primary pl-3">{post.title}</h2>
                  )}
                  {/* Content */}
                  <div>
                    <p className={`text-foreground whitespace-pre-wrap break-words ${!expandedContent[post.id] ? 'line-clamp-3' : ''}`}>
                      {renderContentWithLinks(post.content)}
                    </p>
                    {post.content.length > 200 && (
                      <button
                        onClick={() => setExpandedContent(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="text-primary text-sm font-medium mt-1"
                      >
                        {expandedContent[post.id] ? 'Ver menos' : 'Ver mais'}
                      </button>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(post.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <button
                      onClick={() => handleToggleLike(post.id, post.user_liked)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${post.user_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                    >
                      <Heart className={`h-5 w-5 ${post.user_liked ? 'fill-current' : ''}`} />
                      <span>{post.likes_count}</span>
                    </button>
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>{post.comments_count}</span>
                    </button>
                    <button
                      onClick={() => handleShare(post)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-green-600 transition-colors"
                    >
                      <Share2 className="h-5 w-5" />
                      <span>Compartilhar</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Comments section */}
                  {expandedComments[post.id] && (
                    <div className="pt-3 border-t border-border space-y-3">
                      {(comments[post.id] || []).map(c => (
                        <div key={c.id} className="text-sm">
                          <span className="font-semibold text-foreground">{c.profile_name}</span>{' '}
                          <span className="text-foreground">{c.content}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(c.created_at), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Escreva um comentário..."
                          value={commentInputs[post.id] || ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                          className="flex-1"
                        />
                        <Button size="icon" variant="ghost" onClick={() => handleAddComment(post.id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                  {loading ? 'Carregando...' : 'Carregar mais'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarketNews;
