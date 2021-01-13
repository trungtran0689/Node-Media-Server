import { EventEmitter } from 'events';
import { BufferPool } from './node_core_bufferpool';

export enum SessionStatusEnum {
  CONNECTED = 'connected',
  PUBLISHING = 'publishing',
  SUBSCRIBED = 'subscribed',
  DISCONNECTED = 'disconnected',
}

export enum SessionTypeEnum {
  CONNECTED = 'connected',
  ACCEPTED = 'accepted',
  PUBLISHER = 'publisher',
  SUBSCRIBER = 'subscriber',
}

export abstract class NodeBaseSession extends EventEmitter {
  protected readonly bp: BufferPool;
  public readonly connectTime = new Date();

  constructor(
    public readonly id: string,
    protected readonly sessions: Map<string, NodeBaseSession>,
    protected readonly publishers: Map<string, string>,
    protected readonly idlePlayers: Set<string>,
    protected readonly nodeEvent: EventEmitter,
  ) {
    super();

    this.sessions.set(id, this);

    this.bp = new BufferPool();
    this.bp.on('error', (error) => {
      console.log('buffer_pool_error', error.message);
    });
  }
}
