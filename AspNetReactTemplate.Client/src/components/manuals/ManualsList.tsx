import { useEffect, useState } from 'react';
import { apiService } from '../../lib/apiService';
import { Manual } from '../../types/manual';
import { ManualCard } from './ManualCard';

export const ManualsList = () => {
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiService.getAllManuals()
            .then(data => {
                setManuals(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Načítám kutilské projekty...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <section>
            <h2 className="text-2xl mb-4">Všechny návody</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {manuals.map(m => (
                    <ManualCard key={m.id} manual={m} />
                ))}
            </div>
            {manuals.length === 0 && <p>Zatím tu žádné návody nejsou. Buď první!</p>}
        </section>
    );
};