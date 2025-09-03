# Ensures importing models registers all tables before create_tables() is called.
from .location import Location
from .user import User
from .category import Category
from .product import Product
from .details import Color, Material, Tag, ProductColor, ProductMaterial, ProductTag
from .media import ProductImage
from .price_history import ProductPriceHistory
from .favorites import Favorite
from .messages import Conversation, ConversationParticipant, Message
from .sold import SoldItemArchive
from .item_views import ItemView
