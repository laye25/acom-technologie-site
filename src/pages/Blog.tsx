import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_POSTS as STATIC_POSTS } from '../constants';
import { BlogPost } from '../types';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { syncService } from '../services/syncService';
import { motion } from 'motion/react';
import { Calendar, User, Clock, ArrowRight, ChevronRight, Bookmark } from 'lucide-react';
import { OptimizedImage } from '../components/OptimizedImage';

const Blog = () => {
  // Sync blog posts
  useEffect(() => {
    syncService.syncBlogPosts();
  }, []);

  // Read from Dexie
  const dbPosts = useLiveQuery(() => db.blog_posts.toArray()) || [];
  const loading = false; // Simplified

  const posts = useMemo(() => {
    if (dbPosts.length === 0) {
      return STATIC_POSTS;
    }
    return dbPosts;
  }, [dbPosts]);

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero Section - Editorial (Recipe 2) */}
      <section className="pt-24 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 mb-4"
          >
            <div className="w-12 h-px bg-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-[0.4em] font-bold">Insights</span>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-9xl font-display font-bold text-ink leading-[0.85] tracking-tighter"
            >
              Notre <br />
              <span className="text-primary italic">Blog</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-gray-500 max-w-md font-light leading-relaxed mb-4"
            >
              Découvrez nos derniers articles sur la technologie, le design et le marketing digital pour propulser votre entreprise.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Blog Grid - Editorial (Recipe 11) */}
      <section className="pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {loading && dbPosts.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[500px] bg-gray-100 rounded-[3rem] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex flex-col h-full"
                >
                  <Link 
                    to={`/blog/${post.id}`} 
                    className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-gray-100 mb-4 block shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-500"
                  >
                    <OptimizedImage 
                      src={post.image} 
                      alt={post.title} 
                      width={800}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-6 right-6">
                      <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Bookmark className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                  
                  <div className="flex-grow flex flex-col px-4">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] font-bold">
                        {post.category}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <div className="flex items-center text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3 mr-2" />
                        {post.readTime}
                      </div>
                    </div>
                    
                    <Link to={`/blog/${post.id}`}>
                      <h2 className="text-2xl font-display font-bold text-ink mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {post.title}
                      </h2>
                    </Link>
                    
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3 leading-relaxed font-light">
                      {post.excerpt}
                    </p>
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold text-xs mr-4">
                          {post.author.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink">{post.author}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{post.date}</p>
                        </div>
                      </div>
                      
                      <Link 
                        to={`/blog/${post.id}`}
                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section - Brutalist (Recipe 5) */}
      <section className="py-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto bg-ink rounded-[4rem] p-10 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <h2 className="text-4xl md:text-7xl font-display font-bold text-white mb-6 leading-[0.9] tracking-tighter">
            Restez à la <br />
            <span className="text-primary italic">Pointe du Digital.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-xl mx-auto font-light leading-relaxed">
            Inscrivez-vous à notre newsletter pour recevoir nos derniers articles et conseils d'experts directement dans votre boîte mail.
          </p>
          <form className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <input 
              type="email" 
              placeholder="votre@email.com"
              className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-full text-white focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            <button className="w-full sm:w-auto px-12 py-6 bg-primary text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-primary/40 whitespace-nowrap">
              S'abonner
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
};

export default Blog;
