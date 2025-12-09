import pytest
from types import SimpleNamespace
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.models.product import Product
from app.services.message_service import MessageService


def make_product(product_id=1, seller_id=2):
    return SimpleNamespace(id=product_id, seller_id=seller_id)


def make_conversation(conv_id=10):
    return SimpleNamespace(id=conv_id)


def make_message(msg_id=100, sender_id=1, deleted_at=None):
    return SimpleNamespace(id=msg_id, sender_id=sender_id, deleted_at=deleted_at)


def setup_db_with_product(product: Product | None):
    db = MagicMock()
    query = MagicMock()
    query.filter.return_value = query
    query.first.return_value = product
    db.query.return_value = query
    return db


@pytest.fixture
def message_repo():
    return MagicMock()


def test_list_conversations_delegates_to_repo(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo

    conversations = [make_conversation(1)]
    message_repo.get_conversations_by_user.return_value = conversations

    result = service.list_conversations(user_id=5, limit=2, offset=3)

    assert result == conversations
    message_repo.get_conversations_by_user.assert_called_once_with(5, skip=3, limit=2)


def test_get_conversation_requires_participant(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.is_participant.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        service.get_conversation(1, user_id=2)

    assert exc_info.value.status_code == 403
    message_repo.get_conversation_by_id.assert_not_called()


def test_get_conversation_not_found(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.is_participant.return_value = True
    message_repo.get_conversation_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        service.get_conversation(1, user_id=2)

    assert exc_info.value.status_code == 404


def test_get_conversation_success(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.is_participant.return_value = True
    conv = make_conversation(5)
    message_repo.get_conversation_by_id.return_value = conv

    result = service.get_conversation(5, user_id=2)

    assert result is conv
    message_repo.get_conversation_by_id.assert_called_once_with(5)


def test_start_conversation_missing_product_raises(message_repo):
    db = setup_db_with_product(None)
    service = MessageService(db)
    service.message_repo = message_repo

    with pytest.raises(HTTPException) as exc_info:
        service.start_conversation(creator_id=1, product_id=1, participant_ids=None, first_message="hello")

    assert exc_info.value.status_code == 404
    message_repo.create_conversation.assert_not_called()


def test_start_conversation_adds_participants_and_message(message_repo):
    product = make_product(product_id=1, seller_id=2)
    db = setup_db_with_product(product)
    service = MessageService(db)
    service.message_repo = message_repo

    conv = make_conversation(10)
    message_repo.create_conversation.return_value = conv
    first_msg = make_message(100, sender_id=1)
    message_repo.create_message.return_value = first_msg

    service.start_conversation(creator_id=1, product_id=1, participant_ids=None, first_message="hello")

    message_repo.create_conversation.assert_called_once_with(1)
    # participants: creator + seller
    message_repo.add_participant.assert_any_call(conv.id, 1)
    message_repo.add_participant.assert_any_call(conv.id, 2)
    message_repo.create_message.assert_called_once_with(conv.id, 1, "hello")
    message_repo.commit.assert_called_once()
    db.refresh.assert_any_call(conv)
    db.refresh.assert_any_call(first_msg)


def test_send_message_requires_participant(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.is_participant.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        service.send_message(conversation_id=1, sender_id=1, body="hi")

    assert exc_info.value.status_code == 403
    message_repo.create_message.assert_not_called()


def test_send_message_success(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.is_participant.return_value = True
    msg = make_message(10, sender_id=1)
    message_repo.create_message.return_value = msg

    result = service.send_message(conversation_id=1, sender_id=1, body="hi")

    assert result is msg
    message_repo.create_message.assert_called_once_with(1, 1, "hi")
    message_repo.commit.assert_called_once()
    db.refresh.assert_called_once_with(msg)


def test_edit_message_missing_or_deleted_raises(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.get_message_by_id.return_value = None

    with pytest.raises(HTTPException):
        service.edit_message(message_id=1, editor_id=1, new_body="x")

    message_repo.get_message_by_id.return_value = make_message(1, sender_id=1, deleted_at="now")
    with pytest.raises(HTTPException):
        service.edit_message(message_id=1, editor_id=1, new_body="x")


def test_edit_message_wrong_editor_raises(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.get_message_by_id.return_value = make_message(1, sender_id=2)

    with pytest.raises(HTTPException):
        service.edit_message(message_id=1, editor_id=1, new_body="x")


def test_edit_message_success(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    msg = make_message(1, sender_id=1)
    message_repo.get_message_by_id.return_value = msg
    updated = make_message(1, sender_id=1)
    message_repo.update_message.return_value = updated

    result = service.edit_message(message_id=1, editor_id=1, new_body="updated")

    assert result is updated
    message_repo.update_message.assert_called_once_with(1, "updated")
    message_repo.commit.assert_called_once()
    db.refresh.assert_called_once_with(updated)


def test_delete_message_missing_or_deleted_noop(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.get_message_by_id.return_value = None

    service.delete_message(message_id=1, requester_id=1)
    message_repo.soft_delete_message.assert_not_called()

    message_repo.get_message_by_id.return_value = make_message(1, sender_id=1, deleted_at="now")
    service.delete_message(message_id=1, requester_id=1)
    message_repo.soft_delete_message.assert_not_called()


def test_delete_message_wrong_user_raises(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.get_message_by_id.return_value = make_message(1, sender_id=2)

    with pytest.raises(HTTPException):
        service.delete_message(message_id=1, requester_id=1)


def test_delete_message_success(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.get_message_by_id.return_value = make_message(1, sender_id=1)

    service.delete_message(message_id=1, requester_id=1)

    message_repo.soft_delete_message.assert_called_once_with(1)
    message_repo.commit.assert_called_once()


def test_get_unread_count_delegates(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.get_unread_count.return_value = 3

    count = service.get_unread_count(conversation_id=1, user_id=2)

    assert count == 3
    message_repo.get_unread_count.assert_called_once_with(1, 2)


def test_mark_conversation_as_read_requires_participant(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.is_participant.return_value = False

    with pytest.raises(HTTPException):
        service.mark_conversation_as_read(conversation_id=1, user_id=2)


def test_mark_conversation_as_read_marks_messages(message_repo):
    db = MagicMock()
    service = MessageService(db)
    service.message_repo = message_repo
    message_repo.is_participant.return_value = True
    message_repo.get_unread_messages.return_value = [make_message(1, sender_id=3), make_message(2, sender_id=4)]

    service.mark_conversation_as_read(conversation_id=1, user_id=2)

    message_repo.mark_messages_as_read.assert_called_once_with([1, 2], 2)
    message_repo.commit.assert_called_once()
