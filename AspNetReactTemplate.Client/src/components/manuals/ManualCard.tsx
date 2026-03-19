import { Manual, Difficulty } from '../../types/manual';

interface Props {
    manual: Manual;
}

export const ManualCard = ({ manual }: Props) => {
    return (
        <div className="manual-card" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            {manual.imageUrl && <img src={manual.imageUrl} alt={manual.title} style={{ width: '100%' }} />}
            <h3>{manual.title}</h3>
            <p>{manual.description.substring(0, 100)}...</p>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.9em' }}>
                <span>⏱️ {manual.estimatedTimeMinutes} min</span>
                <span>📊 Náročnost: {Difficulty[manual.difficulty]}</span>
            </div>
        </div>
    );
};