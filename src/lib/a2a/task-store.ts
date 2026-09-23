/**
 * Durable A2A TaskStore (SPEC-0021). Serverless invocations don't share memory, so a task that
 * pauses in INPUT_REQUIRED must survive until the follow-up message arrives — tasks are stored in
 * the durable store (Upstash Redis in production) as their A2A JSON form, with a 1-hour TTL.
 */
import { Task } from '@a2a-js/sdk';
import type { TaskStore } from '@a2a-js/sdk/server';
import { UnsupportedOperationError } from '@a2a-js/sdk/errors';
import { kvGetJson, kvSetJson } from '@/lib/durable-store';

const TASK_TTL_S = 60 * 60;
const key = (taskId: string) => `a2a:task:${taskId}`;

export class DurableTaskStore implements TaskStore {
  async save(task: Task): Promise<void> {
    await kvSetJson(key(task.id), Task.toJSON(task), TASK_TTL_S);
  }

  async load(taskId: string): Promise<Task | undefined> {
    const raw = await kvGetJson<unknown>(key(taskId));
    return raw ? Task.fromJSON(raw) : undefined;
  }

  async list(): Promise<never> {
    // Tasks are private to whoever holds the id; listing all tasks is intentionally unsupported.
    throw new UnsupportedOperationError('ListTasks is not supported by this agent');
  }
}
