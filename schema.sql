create table invoice_anonymous (
	invoice_anonymous_id int unsigned auto_increment not null,
	invoice_uuid char(36) not null,
	unique key (invoice_uuid),
	primary key (invoice_anonymous_id)
);

create table line_item_anonymous (
	line_item_anonymous_id int unsigned auto_increment not null,
	description varchar(1000) not null,
	invoice_anonymous_id INT UNSIGNED NOT NULL,
	FOREIGN KEY (invoice_anonymous_id) REFERENCES invoice_anonymous (invoice_anonymous_id),
	primary key (line_item_anonymous_id)
);

create table line_item_anonymous_image (
	line_item_anonymous_image_id int unsigned auto_increment not null,
	image blob not null,
	line_item_anonymous_id INT UNSIGNED NOT NULL,
	FOREIGN KEY (line_item_anonymous_id) REFERENCES line_item_anonymous (line_item_anonymous_id),
	primary key (line_item_anonymous_image_id)
);

-- 2023-11-29
