import { useEffect, useState } from "react";
import { Award, LockKeyhole, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EmptyState from "../../components/ui/EmptyState";
import SectionTitle from "../../components/ui/SectionTitle";
import { api } from "../../lib/api";

function mergeAchievements(allAchievements, myAchievements) {
  const unlockedMap = new Map(
    myAchievements.map((achievement) => [achievement.achievementId, achievement])
  );

  const sourceList = allAchievements.length ? allAchievements : myAchievements;

  return sourceList
    .map((achievement) => {
      const unlocked = unlockedMap.get(achievement.achievementId);

      return {
        ...achievement,
        unlockedAt: unlocked?.unlockedAt || achievement.unlockedAt || null,
        progressValue: unlocked?.progressValue ?? achievement.progressValue ?? null
      };
    })
    .sort((left, right) => Number(Boolean(right.unlockedAt)) - Number(Boolean(left.unlockedAt)));
}

function AchievementsPage() {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAchievements() {
      setIsLoading(true);

      const [allResult, myResult] = await Promise.allSettled([
        api.getAchievements(),
        token ? api.getMyAchievements(token) : Promise.resolve({ data: [] })
      ]);

      if (!isMounted) {
        return;
      }

      const allAchievements = allResult.status === "fulfilled" ? allResult.value.data : [];
      const myAchievements = myResult.status === "fulfilled" ? myResult.value.data : [];

      setAchievements(mergeAchievements(allAchievements, myAchievements));
      setIsLoading(false);
    }

    loadAchievements().catch(() => {
      if (!isMounted) {
        return;
      }

      setAchievements([]);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const unlockedCount = achievements.filter((achievement) => achievement.unlockedAt).length;

  return (
    <section className="panel profile-page">
      <SectionTitle
        eyebrow="Thành tựu"
        title="Quản lý thành tựu"
        description="Theo dõi các cột mốc bạn đã mở khóa trong hệ thống board game."
        meta={`${unlockedCount}/${achievements.length || 0} đã mở`}
      />

      {isLoading ? (
        <div className="card-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={index} className="feature-card achievement-card achievement-card--loading">
              <span className="tag">Đang tải...</span>
              <strong>Đang nạp thành tựu</strong>
              <p className="muted">Hệ thống đang lấy dữ liệu thành tựu của bạn.</p>
            </article>
          ))}
        </div>
      ) : achievements.length ? (
        <div className="card-grid">
          {achievements.map((achievement) => {
            const unlocked = Boolean(achievement.unlockedAt);

            return (
              <article
                key={achievement.achievementId}
                className={`feature-card achievement-card ${unlocked ? "is-unlocked" : "is-locked"}`}
              >
                <div className="achievement-card__top">
                  <div className="achievement-card__icon" aria-hidden="true">
                    {unlocked ? <Trophy size={18} /> : <LockKeyhole size={18} />}
                  </div>
                  <span className={`tag ${unlocked ? "tag--success" : "tag--warning"}`}>
                    {unlocked ? "Đã mở khóa" : "Chưa mở khóa"}
                  </span>
                </div>

                <strong>{achievement.name}</strong>
                <p>{achievement.description}</p>

                <div className="achievement-card__meta">
                  <span className="tag">{achievement.points} điểm</span>
                  {achievement.progressValue !== null && achievement.progressValue !== undefined ? (
                    <span className="tag">Tiến độ: {achievement.progressValue}</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="Chưa có thành tựu để hiển thị"
          description="Hiện chưa có dữ liệu thành tựu hoặc hệ thống chưa tải được danh sách."
        />
      )}
    </section>
  );
}

export default AchievementsPage;
