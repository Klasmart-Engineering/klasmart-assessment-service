import { createParamDecorator } from "type-graphql";

export interface Context {
    ip: string | string[]
    user_id?: string
}

export function UserID() {
    return createParamDecorator<Context>(({ context }) => context.user_id);
}