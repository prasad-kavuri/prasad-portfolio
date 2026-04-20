import { permanentRedirect } from 'next/navigation';

export default function SpatialSimulationRedirectPage() {
  permanentRedirect('/demos/world-generation');
}
