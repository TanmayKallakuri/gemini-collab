export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string | null;
  content: string;
  is_ai: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profiles?: Profile;
}
