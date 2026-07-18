import fs from 'fs';

const content = fs.readFileSync('src/application/EventBus.ts', 'utf8');
const newContent = content.replace(
  '  subscribe(eventType: string, handler: EventHandler) {\n    if (!this.handlers[eventType]) {\n      this.handlers[eventType] = [];\n    }\n    this.handlers[eventType].push(handler);\n  }',
  `  subscribe(eventType: string, handler: EventHandler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
    return () => this.unsubscribe(eventType, handler);
  }

  unsubscribe(eventType: string, handler: EventHandler) {
    if (!this.handlers[eventType]) return;
    this.handlers[eventType] = this.handlers[eventType].filter(h => h !== handler);
  }`
);
fs.writeFileSync('src/application/EventBus.ts', newContent);
