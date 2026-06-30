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
    name: "Irene Konschill",
    role: "Architect, RIBA",
    bio: "Irene founded ArchitectureLIVE in 2009 and has worked as a qualified architect for over 20 years. Originally from Vienna, she trained at the Technical University of Vienna and the University of Portsmouth. Before starting the practice she was an associate and lead project architect at Alison Brooks Architects, working on the Stirling Prize-winning Accordia scheme in Cambridge, and her designs have won Housing Design Awards.",
    image: irene,
  },
  {
    name: "Jonathan Gratton",
    role: "Architect, RIBA",
    bio: "Jonathan has over 20 years' experience as a qualified architect and trained as a BREEAM sustainability assessor, so a practical approach to sustainability runs through everything we design. He has worked on challenging sites and listed buildings on projects worth up to £40 million, and has led education work including the new-build St Bartholomew's secondary school.",
    image: jonathan,
  },
];
