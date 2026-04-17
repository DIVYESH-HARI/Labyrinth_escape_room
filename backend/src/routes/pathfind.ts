import { Router } from 'express';
import { bfsSonar } from '../algorithms/bfs';
import { aStarPath } from '../algorithms/astar';
import { dijkstraStamina } from '../algorithms/dijkstra';
import { bellmanFordPath } from '../algorithms/bellman_ford';
import { greedyBestFirstPath } from '../algorithms/greedy_bfs';

const router = Router();

router.post('/bfs', (req, res) => {
    // tier defaults to 1 if not passed
    const { grid, start, targets, tier = 1 } = req.body; 

    if (!grid || !start || !targets) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const result = bfsSonar(grid, start, targets, tier);
    res.json(result);
});

router.post('/astar', (req, res) => {
    const { grid, start, goal, heuristic } = req.body;
    if (!grid || !start || !goal) return res.status(400).json({ error: 'Missing parameters' });

    const hType = (heuristic === 'euclidean') ? 'euclidean' : 'manhattan';
    const result = aStarPath(grid, start, goal, hType);
    res.json(result);
});

router.post('/greedy', (req, res) => {
    const { grid, start, goal } = req.body;
    if (!grid || !start || !goal) return res.status(400).json({ error: 'Missing parameters' });
    const result = greedyBestFirstPath(grid, start, goal);
    res.json(result);
});

router.post('/dijkstra', (req, res) => {
    const { grid, playerPos } = req.body;
    if (!grid || !playerPos) return res.status(400).json({ error: 'Missing parameters' });

    const result = dijkstraStamina(grid, playerPos);
    res.json(result);
});

router.post('/bellman', (req, res) => {
    const { grid, start, goal } = req.body;
    if (!grid || !start || !goal) return res.status(400).json({ error: 'Missing parameters' });

    const result = bellmanFordPath(grid, start, goal);
    res.json(result);
});

export default router;
