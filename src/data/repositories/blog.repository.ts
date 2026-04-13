import { BaseRepository } from './base.repository';
import { BlogPost } from '../../types';

class BlogRepository extends BaseRepository<BlogPost> {
  protected collectionName = 'blog_posts';
}

export const blogRepository = new BlogRepository();
