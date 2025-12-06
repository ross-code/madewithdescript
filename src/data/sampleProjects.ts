import { Project } from '@/types/project';
import sparkingEquity from '@/assets/projects/sparking-equity.jpg';
import livingInOrlando from '@/assets/projects/living-in-orlando.jpg';
import nextracks from '@/assets/projects/nextracks.jpg';
import gardenYay from '@/assets/projects/garden-yay.jpg';
import aaronMakelky from '@/assets/projects/aaron-makelky.jpg';
import dotoliGroup from '@/assets/projects/dotoli-group.jpg';
import marinesMemorial from '@/assets/projects/marines-memorial.jpg';
import secondStringAnalyst from '@/assets/projects/2ndstringanalyst.jpg';
import carnivoreRabbi from '@/assets/projects/carnivore-rabbi.jpg';
import travelingWithEx from '@/assets/projects/traveling-with-ex.jpg';
import laffinWithLincoln from '@/assets/projects/laffin-with-lincoln.jpg';
import bestMotorcycleRoads from '@/assets/projects/best-motorcycle-roads.jpg';
import rossZeiger from '@/assets/projects/ross-zeiger.jpg';
import descriptMastery from '@/assets/projects/descript-mastery.svg';
import salesRebellion from '@/assets/projects/sales-rebellion.jpg';
import angelaGroeneveld from '@/assets/projects/angela-groeneveld.jpg';
import converlation from '@/assets/projects/converlation.jpg';
import talesFromJarSide from '@/assets/projects/tales-from-jar-side.jpg';

export const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'Sparking Equity',
    description: 'A podcast focused on equity and social justice topics',
    url: 'https://www.buzzsprout.com/2243528',
    imageUrl: sparkingEquity,
    category: 'podcast',
    createdAt: new Date('2024-01-15'),
    featured: true,
  },
  {
    id: '2',
    name: 'Living in Orlando with Michael Rains',
    description: 'Your guide to living in Greater Orlando with local insights',
    url: 'https://www.youtube.com/@LivingInGreaterOrlando',
    imageUrl: livingInOrlando,
    category: 'youtube',
    createdAt: new Date('2024-02-20'),
    featured: true,
  },
  {
    id: '3',
    name: 'Nextracks',
    description: 'Music and production content for creators',
    url: 'https://www.youtube.com/@Nextracks',
    imageUrl: nextracks,
    category: 'youtube',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    name: 'Garden YAY',
    description: 'Gardening tips, tricks, and joyful content for plant lovers',
    url: 'https://www.youtube.com/@GardenYAY',
    imageUrl: gardenYay,
    category: 'youtube',
    createdAt: new Date('2024-03-25'),
  },
  {
    id: '5',
    name: 'Aaron Makelky',
    description: 'Creative content and storytelling from Aaron Makelky',
    url: 'https://www.youtube.com/@AaronMakelky',
    imageUrl: aaronMakelky,
    category: 'youtube',
    createdAt: new Date('2024-04-05'),
  },
  {
    id: '6',
    name: 'Dotoli Group at Compass',
    description: 'Real estate insights and property tours',
    url: 'https://www.youtube.com/@DotoliGroupatCompass',
    imageUrl: dotoliGroup,
    category: 'youtube',
    createdAt: new Date('2024-04-15'),
  },
  {
    id: '7',
    name: "Marine's Memorial Club & Hotel",
    description: 'Content from the historic Marine\'s Memorial Club & Hotel',
    url: 'https://www.youtube.com/@MarinesMemorial',
    imageUrl: marinesMemorial,
    category: 'youtube',
    createdAt: new Date('2024-05-01'),
  },
  {
    id: '8',
    name: '2ndStringAnalyst',
    description: 'Sports analysis and commentary',
    url: 'https://www.tiktok.com/@2ndstringanalyst',
    imageUrl: secondStringAnalyst,
    category: 'other',
    createdAt: new Date('2024-05-10'),
  },
  {
    id: '9',
    name: 'Carnivore Rabbi',
    description: 'Health, nutrition, and carnivore lifestyle content',
    url: 'https://www.youtube.com/@carnivorerabbi/',
    imageUrl: carnivoreRabbi,
    category: 'youtube',
    createdAt: new Date('2024-05-15'),
    featured: true,
  },
  {
    id: '10',
    name: 'Traveling with Ex',
    description: 'Unique travel adventures and stories',
    url: 'https://www.youtube.com/@travelingwithex',
    imageUrl: travelingWithEx,
    category: 'youtube',
    createdAt: new Date('2024-05-20'),
  },
  {
    id: '11',
    name: 'Laffin with Lincoln',
    description: 'Comedy and entertainment content',
    url: 'https://www.youtube.com/@LaffinwithLincoln',
    imageUrl: laffinWithLincoln,
    category: 'youtube',
    createdAt: new Date('2024-05-25'),
  },
  {
    id: '12',
    name: 'Best Motorcycle Roads Podcast',
    description: 'Discover the best motorcycle roads and riding adventures',
    url: 'https://www.youtube.com/@BestMotorcycleRoads',
    imageUrl: bestMotorcycleRoads,
    category: 'podcast',
    createdAt: new Date('2024-06-01'),
  },
  {
    id: '13',
    name: 'Ross Zeiger',
    description: 'Creative content and insights from Ross Zeiger',
    url: 'https://www.youtube.com/@rosszeiger',
    imageUrl: rossZeiger,
    category: 'youtube',
    createdAt: new Date('2024-06-05'),
  },
  {
    id: '14',
    name: 'Descript Mastery',
    description: 'Master Descript with tutorials, tips, and tricks',
    url: 'https://www.youtube.com/@DescriptMastery',
    imageUrl: descriptMastery,
    category: 'course',
    createdAt: new Date('2024-06-10'),
    featured: true,
  },
  {
    id: '15',
    name: 'Sales Rebellion',
    description: 'Revolutionary sales techniques and strategies',
    url: 'https://www.youtube.com/@SalesRebellion',
    imageUrl: salesRebellion,
    category: 'youtube',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: '16',
    name: 'Angela Groeneveld - Emerge Agency',
    description: 'Marketing and agency insights from Angela Groeneveld',
    url: 'https://www.youtube.com/@angelagroeneveld/videos',
    imageUrl: angelaGroeneveld,
    category: 'youtube',
    createdAt: new Date('2024-06-20'),
  },
  {
    id: '17',
    name: 'Converlation',
    description: 'Meaningful conversations and discussions',
    url: 'https://www.youtube.com/channel/UCEPU9WE4WwDrS2B4zGIaWCQ',
    imageUrl: converlation,
    category: 'youtube',
    createdAt: new Date('2024-06-25'),
  },
  {
    id: '18',
    name: 'Tales from the Jar Side',
    description: 'Programming and tech stories with a twist',
    url: 'https://youtube.com/@talesfromthejarside',
    imageUrl: talesFromJarSide,
    category: 'youtube',
    createdAt: new Date('2024-06-30'),
  },
];
