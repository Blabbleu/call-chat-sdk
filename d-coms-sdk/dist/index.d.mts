import { JSX } from 'react';

interface ChatCenterProps {
    userId: string;
    onLeave?: () => void;
}
declare function ChatCenter({ userId, onLeave }: ChatCenterProps): JSX.Element;

export { ChatCenter, type ChatCenterProps };
