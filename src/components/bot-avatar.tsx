import { Avatar, AvatarImage } from "./ui/avatar";

export default function BotAvatar() {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage className="p1" src="/logo.png" />
    </Avatar>
  );
}
