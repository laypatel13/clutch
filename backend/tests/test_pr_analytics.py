from types import SimpleNamespace

from app.services.pr_analytics import get_review_stats


def _pr(state, review_count):
    return SimpleNamespace(state=state, review_count=review_count)


def test_empty_list_returns_zero_shape():
    assert get_review_stats([]) == {
        "merged_prs": 0,
        "reviewed_rate": None,
        "avg_reviews_per_merged_pr": None,
        "unreviewed_merged_count": 0,
    }


def test_no_merged_prs_returns_zero_shape():
    prs = [_pr("OPEN", 3), _pr("CLOSED", 0)]
    assert get_review_stats(prs) == {
        "merged_prs": 0,
        "reviewed_rate": None,
        "avg_reviews_per_merged_pr": None,
        "unreviewed_merged_count": 0,
    }


def test_aggregates_review_engagement_over_merged_only():
    prs = [_pr("MERGED", 2), _pr("MERGED", 0), _pr("OPEN", 5)]
    stats = get_review_stats(prs)
    assert stats["merged_prs"] == 2
    assert stats["reviewed_rate"] == 0.5
    assert stats["unreviewed_merged_count"] == 1
    assert stats["avg_reviews_per_merged_pr"] == 1.0


def test_none_review_count_is_treated_as_zero():
    prs = [_pr("MERGED", None), _pr("MERGED", 4)]
    stats = get_review_stats(prs)
    assert stats["merged_prs"] == 2
    assert stats["unreviewed_merged_count"] == 1
    assert stats["avg_reviews_per_merged_pr"] == 2.0
