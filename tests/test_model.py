import json
import math
import unittest
from pathlib import Path
from backend.model import simulate, wind_uv, interpolate_wind, distance_km
from backend.ingest import normalize_fires
from backend.server import dataset_path
from backend.import_observations import normalize_observations

START='2026-10-08T09:00:00+00:00'
def grid(u,v):
    return [{'lat':lat,'lon':lon,'hours':[{'u':u,'v':v} for _ in range(25)]} for lat in (26,33) for lon in (72,80)]

class TransportTests(unittest.TestCase):
    def test_meteorological_from_direction(self):
        u,v=wind_uv(10,270)
        self.assertAlmostEqual(u,10)
        self.assertAlmostEqual(v,0)
        u,v=wind_uv(10,0)
        self.assertAlmostEqual(u,0)
        self.assertAlmostEqual(v,-10)

    def test_advection_units_and_decay(self):
        frames=simulate([{'lat':30,'lon':76}],grid(5,0),START,hours=1,particles_per_source=1,diffusion=0)
        p=frames[-1]['particles'][0]
        self.assertAlmostEqual(distance_km(30,76,p[0],p[1]),18,delta=.05)
        self.assertAlmostEqual(p[3],math.exp(-1/12),places=3)
        self.assertEqual(frames[-1]['hour'],1)

    def test_seed_reproducibility(self):
        kwargs={'sources':[{'lat':30,'lon':76}],'grid':grid(2,-1),'start':START,'hours':2}
        self.assertEqual(simulate(**kwargs),simulate(**kwargs))
        self.assertNotEqual(simulate(**kwargs),simulate(**kwargs,seed=5))

    def test_calm_without_diffusion_stays_put(self):
        frames=simulate([{'lat':30,'lon':76}],grid(0,0),START,hours=2,diffusion=0)
        self.assertEqual(frames[-1]['particles'][0][:2],[30,76])

    def test_no_wind_or_insufficient_coverage_fails(self):
        with self.assertRaises(ValueError):simulate([{'lat':30,'lon':76}],[],START)
        with self.assertRaises(ValueError):simulate([{'lat':30,'lon':76}],[{'lat':30,'lon':76,'hours':[]}],START)

    def test_interpolates_vectors_across_direction_wrap(self):
        a=wind_uv(5,359);b=wind_uv(5,1)
        g=[{'lat':30,'lon':76,'hours':[dict(zip(('u','v'),a)),dict(zip(('u','v'),b))]}]
        u,v=interpolate_wind(g,30,76,.5)
        self.assertAlmostEqual(u,0,places=6)
        self.assertLess(v,-4.99)

    def test_outside_domain_removed(self):
        f=simulate([{'lat':30,'lon':79.99}],grid(40,0),START,hours=1,diffusion=0)
        self.assertEqual(f[-1]['particles'],[])

    def test_parser_filters_and_deduplicates(self):
        # Synthetic records exist only as unit-test fixtures, never product data.
        raw=b'latitude,longitude,acq_date,acq_time,confidence,frp\n30,76,2026-10-08,930,nominal,4\n30,76,2026-10-08,930,nominal,4\n1,1,2026-10-08,930,low,1\n'
        sources=normalize_fires(raw)
        self.assertEqual(len(sources),1)
        self.assertEqual(sources[0]['detectedAt'],'2026-10-08T09:30:00+00:00')

    def test_api_path_validation(self):
        self.assertIsNone(dataset_path('/replay/../../secret'))
        self.assertIsNone(dataset_path('/replay/capture-20261008T0900/extra'))
        self.assertEqual(dataset_path('/replay/capture-20261008T0900'),'capture-20261008T0900.json')
        self.assertEqual(dataset_path('/replay/capture-20261008T0900-0123456789abcdef0123456789abcdef'),'capture-20261008T0900-0123456789abcdef0123456789abcdef.json')
        self.assertIsNone(dataset_path('/replay/capture-20261008T0900-0123456789abcdef0123456789abcdef/extra'))
        self.assertIsNone(dataset_path('/replay/capture-20261008T0900-../../secret'))

    def test_observations_require_timestamps_and_provenance(self):
        header='station,latitude,longitude,time,pm25,unit,source_url\n'
        row='test,28.6,77.2,2026-10-08T09:00:00Z,10,ug/m3,https://example.org/source\n'
        result=normalize_observations(header+row,START,'2026-10-09T09:00:00Z')
        self.assertEqual(result[0]['value'],10)
        for bad in (row.replace('https://example.org/source',''),row.replace('09:00:00Z','09:00:00'),row.replace(',10,',',nan,')):
            with self.assertRaises(ValueError):normalize_observations(header+bad,START,'2026-10-09T09:00:00Z')

    def test_captured_dataset_contract(self):
        path=Path('public/data/latest.json')
        if not path.exists():self.skipTest('No captured dataset yet')
        data=json.loads(path.read_text(encoding='utf-8'))
        self.assertEqual(len(data['frames']),25)
        self.assertEqual(data['frames'][0]['hour'],0)
        self.assertEqual(data['frames'][-1]['hour'],24)
        self.assertEqual(len(data['frames'][0]['particles']),len(data['sources'])*8)
        self.assertTrue(all(0<=p[3]<=1 for f in data['frames'] for p in f['particles']))
        self.assertTrue(all(len(g['hours'])==25 for g in data['wind']))
        self.assertTrue(data['provenance']['fires']['sha256'])

if __name__=='__main__':unittest.main()
