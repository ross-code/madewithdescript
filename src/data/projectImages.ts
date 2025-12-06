// Local asset imports for seeded projects
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

// Map project names to local asset paths
export const localProjectImages: Record<string, string> = {
  'Sparking Equity': sparkingEquity,
  'Living in Orlando with Michael Rains': livingInOrlando,
  'Nextracks': nextracks,
  'Garden YAY': gardenYay,
  'Aaron Makelky': aaronMakelky,
  'Dotoli Group at Compass': dotoliGroup,
  "Marine's Memorial Club & Hotel": marinesMemorial,
  '2ndStringAnalyst': secondStringAnalyst,
  'Carnivore Rabbi': carnivoreRabbi,
  'Traveling with Ex': travelingWithEx,
  'Laffin with Lincoln': laffinWithLincoln,
  'Best Motorcycle Roads Podcast': bestMotorcycleRoads,
  'Ross Zeiger': rossZeiger,
  'Descript Mastery': descriptMastery,
  'Sales Rebellion': salesRebellion,
  'Angela Groeneveld - Emerge Agency': angelaGroeneveld,
  'Converlation': converlation,
  'Tales from the Jar Side': talesFromJarSide,
};

// Get image URL - prefer local asset, fallback to database URL
export const getProjectImage = (projectName: string, dbImageUrl: string): string => {
  return localProjectImages[projectName] || dbImageUrl;
};