/**
 * Team data for the About / Studio page.
 * Import images as ImageMetadata so Astro's image pipeline can optimise them.
 * Swap placeholder JPGs for real portraits when available.
 */
import jonathan from "../assets/team/jonathan.jpg";
import irene from "../assets/team/irene.jpg";

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: ImageMetadata;
  email?: string;
}

export const team: TeamMember[] = [
  {
    name: "Jonathan Gratton",
    role: "Principal Architect",
    bio: "Jonathan founded ArchitectureLIVE and leads the practice across residential, conservation and commercial work. He brings a thoughtful approach to each project — combining contemporary design with a deep respect for the Surrey, Sussex and Hampshire landscape.",
    image: jonathan,
  },
  {
    name: "Irene Konschill",
    role: "Architect",
    bio: "Irene leads the residential team, bringing careful attention to detailing and the quality of everyday spaces. Her eye for daylight, materiality and the small moves that make a building feel right is central to how ArchitectureLIVE works.",
    image: irene,
  },
];
