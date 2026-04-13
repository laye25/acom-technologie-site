import { BaseRepository } from './base.repository';
import { Message } from '../../types';

class MessageRepository extends BaseRepository<Message> {
  protected collectionName = 'messages';
}

export const messageRepository = new MessageRepository();
