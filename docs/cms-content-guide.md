# Craft & Colours CMS content guide

How to manage products, workshops, journal posts, settings and users in WordPress.

## Before you start

You edit content at **cms.craftandcolors.africa/wp-admin**, and shoppers see it on **craftandcolors.africa** after the site rebuilds. The storefront is a separate copy of your content, so saving in WordPress does not change it instantly.

### When changes go live

1. You click **Publish** or **Update**.
2. WordPress waits about 5 minutes, so several edits are grouped into one rebuild.
3. GitHub rebuilds and uploads the site, which takes a few more minutes.
4. Refresh the storefront page to see the change.

Allow 10 to 20 minutes in total. Administrators and Shop Managers can skip the 5-minute wait by clicking **Rebuild site** in the black bar at the top of WordPress.

### What updates without a rebuild

| Shown to shoppers                  | When it updates        |
| ---------------------------------- | ---------------------- |
| Cart and checkout prices and stock | Immediately            |
| Seats left on workshop pages       | Immediately            |
| Prices and stock on shop pages     | After the next rebuild |
| Seats left on the home page        | After the next rebuild |
| Everything else                    | After the next rebuild |

### Changes that need a manual rebuild

These do not start a rebuild on their own, so click **Rebuild site** afterwards:

- A scheduled sale starting or ending.
- A workshop's date passing. It stays listed as upcoming until the next rebuild, although RSVPs close on time.
- Editing an image's alt text in the Media Library.
- Saving variations, unless you also click **Update** on the product.

## Products

Create products under **Products → Add new**, and choose **Simple product** unless shoppers need to pick an option such as colour or size. Only Administrators and Shop Managers can edit products.

### Create a simple product

1. Go to **Products → Add new**.
2. Enter the product name.
3. Write the long description in the main editor. It appears under **Details** on the product page.
4. In **Product data**, leave the type as **Simple product**.
5. On the **General** tab, enter the **Regular price** in KES. Add a **Sale price** only if it is on offer.
6. On the **Inventory** tab, tick **Stock management** and enter the **Quantity**. Add an SKU if you use them.
7. Fill in **Short description**. It appears near the top of the product page.
8. Fill in **Good to know** for care, safety or usage tips. Leave it empty to use the site-wide default.
9. Choose at least one category in **Product categories**.
10. Set the **Product image**, and add other photos under **Product gallery**.
11. Click **Publish**.

### Where each field appears

| WordPress field        | On the storefront                                       |
| ---------------------- | ------------------------------------------------------- |
| Product name           | Product cards and page heading                          |
| Short description      | Near the top of the product page and in search results  |
| Main description       | **Details** section                                     |
| Good to know           | **Good to know** section                                |
| Product image          | Shop card and first gallery slide                       |
| First gallery image    | Second slide, and the card's image on hover             |
| Regular and sale price | Price, sale marking and the shop's sale filter          |

If the main description is empty, **Details** uses the short description. An empty section is hidden.

### Product photos

- Use portrait 4:5 photos, about 1200 × 1500 px.
- Do not add the main image to the gallery as well.
- Drag gallery images to reorder them, then click **Update**. Gallery changes are not saved until you do.
- Write alt text in the **Alternative text** field when you choose the image. Describe the photo, for example "Set of 12 acrylic paint tubes in a box".
- The product name is used if alt text is empty.

### Create a product with options

Use a **Variable product** when each option has its own price or stock. Set up the attribute first, as described under [Attributes](#attributes).

1. Create the product as above, then change **Product data** to **Variable product**.
2. On the **Attributes** tab, add the attribute and select its values.
3. Tick **Used for variations**, then click **Save attributes**.
4. On the **Variations** tab, click **Generate variations**.
5. Open each variation and enter its **Regular price** and stock. A variation without a price cannot be bought.
6. Click **Save changes** on the **Variations** tab.
7. Click **Publish** or **Update** on the product. This starts the rebuild.

### Edit, hide or remove a product

| To do this                           | Do this                                                         |
| ------------------------------------ | --------------------------------------------------------------- |
| Change price, stock or text          | Open the product, edit it and click **Update**                  |
| Update several products              | Tick them in **All products**, then use **Bulk actions → Edit** |
| Mark as sold out                     | Set the quantity to 0                                           |
| Hide from the shop but keep its link | Set **Catalog visibility** to **Hidden** in the **Publish** box |
| Remove from the site                 | Click **Move to Trash**                                         |

Avoid changing the **Permalink** of a published product. Its address is `/shop/<slug>/`, so old links and search results would stop working.

### Fields that have no effect yet

- **Featured** (the star) does not change anything on the storefront. The home page lists bestsellers by sales.
- The **Upsells** and **Cross-sells** fields are not shown.
- The **Fresh arrivals** shop filter currently finds nothing, because the storefront has no rule yet for what counts as new.

## Categories, tags and attributes

Categories organise the shop, and attributes power product options and shop filters. Tags are not shown on the storefront, so you can skip them.

### Categories

Manage categories under **Products → Categories**. The storefront depends on these seven slugs, so do not rename or delete them:

| Category slug | Used for                                |
| ------------- | --------------------------------------- |
| `paint`       | Shop menu, home page                    |
| `stitch-sew`  | Shop menu, home page                    |
| `clay`        | Shop menu                               |
| `sketch`      | Shop menu                               |
| `kids`        | Shop menu, home page                    |
| `diy-kits`    | Shop menu, DIY kits page                |
| `bundles`     | Shop menu, home page (first 3 products) |

To add a category:

1. Enter its **Name**. WordPress creates the **Slug** for you.
2. Click **Add new category**.
3. Assign at least one published product. A category appears in the shop only once it has one.

Keep categories flat by leaving **Parent category** set to **None**. Shop filters only count products placed directly in a category. New categories use a generic icon and description in the shop menu, and a developer can change them. The category **Description** and **Thumbnail** are not shown on the storefront.

### Attributes

An attribute is a property shared by products, such as Finish, and its terms are the values, such as Matte and Satin. Create them centrally, because attributes added on a single product cannot be shop filters.

1. Go to **Products → Attributes**.
2. Enter a **Name**, such as Finish, and click **Add attribute**. Do not use the slugs `category`, `fresh`, `sale` or `max`, which the shop already uses.
3. Click **Configure terms** beside the attribute, and add each value.
4. Open a product, go to **Product data → Attributes**, and add the attribute with the values that apply.
5. Click **Save attributes**, then **Update**.

### Shop filters

Each category chooses its own filters, so Paint can filter by Finish while Stitch & Sew filters by Fibre.

1. Go to **Products → Categories** and click **Edit** on the category.
2. Find the **Shop filters** table.
3. For each attribute, set the options below.
4. Click **Update**.

| Option            | What it does                                                          |
| ----------------- | --------------------------------------------------------------------- |
| Show              | Turns the filter on for this category                                 |
| Position          | Sets the order, with lower numbers first                              |
| Label             | Sets the shopper-facing name. Leave empty to use the attribute's name |
| Shoppers can pick | **One** option or **many**                                            |

A filter only lists values used by products in that category. If no product uses the attribute, the filter does not appear.

## Workshops and meetups

The **Ticket product** field decides how a session is booked. With no ticket it is a free RSVP, and with a ticket it is paid through the cart.

|                    | Free session                    | Paid session                     |
| ------------------ | ------------------------------- | -------------------------------- |
| **Ticket product** | None — free meetup (RSVP)       | A WooCommerce product you create |
| **Booking**        | Name and email form on the site | Cart and checkout                |
| **Seats left**     | Capacity minus RSVPs            | The ticket's stock quantity      |
| **Price**          | Free                            | The ticket's price               |

**Type** only sets the label, Workshop or Meetup. It does not make a session free or paid.

### Create a free session

1. Go to **Workshops → Add New**.
2. Enter the title. Check it carefully, because the page address is created from it when you first publish, and later title changes do not update the address.
3. Write the full description in the main editor.
4. Write one or two sentences in **Excerpt** for workshop cards. If you leave it empty, WordPress shortens the description.
5. Fill in **Session details** using the table below.
6. Set the **Featured image**, ideally a landscape 16:10 photo at least 1200 px wide. Add alt text when you choose it.
7. Click **Publish**.

| Session detail | What to enter                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Starts         | Date and start time, in Nairobi time. **Required:** a session without it does not appear on the site |
| Ends (time)    | End time on the same day. The site works out the duration from it                                     |
| Type           | Workshop or Meetup                                                                                    |
| Skill level    | For example, "Zero experience needed"                                                                 |
| Location       | Defaults to Village Market, Nairobi                                                                   |
| Capacity       | Number of seats. **A free session left at 0 shows as fully booked**                                   |
| Ticket product | Leave as **None** for a free session                                                                  |

### Create a paid session

Create the ticket first, then link it to the session.

1. Go to **Products → Add new** and name the ticket after the session.
2. Tick **Virtual** in **Product data**. Only virtual products appear in the ticket list.
3. Enter the **Regular price**.
4. On the **Inventory** tab, tick **Stock management** and set **Quantity** to the number of seats.
5. In the **Publish** box, set **Catalog visibility** to **Hidden**, so the ticket stays out of the shop.
6. Publish the ticket.
7. Create the session as above, and select the ticket under **Ticket product**.
8. Set **Capacity** to the same number as the ticket's quantity.
9. Click **Publish**.

### Edit a session

Open it under **Workshops → All workshops**, change it and click **Update**. That list also shows each session's start time and seats left.

- **Add seats to a free session:** raise **Capacity**.
- **Add seats to a paid session:** raise the ticket's stock **Quantity**, and update **Capacity** to match.
- **Change a paid session's price:** edit the ticket's price, not the workshop.
- **Cancel a session:** set it back to **Draft** or move it to the Trash, then contact anyone already booked.

Past sessions move to the past section of the Workshops page after a rebuild. Leave them published if you want them to stay there.

### See who has booked

- **Free sessions:** open the session and look at the **RSVPs** box on the right. Click **Download CSV** for a spreadsheet.
- **Paid sessions:** go to **WooCommerce → Orders** and look for orders containing the ticket.

The storefront ignores repeat RSVPs from the same email address. WordPress has no button for removing an RSVP, so ask your developer if you need one deleted.

## Journal posts

Journal posts are normal WordPress posts under **Posts**. The **Journal** page shows the newest 24, and the home page shows the newest 3.

### Create a post

1. Go to **Posts → Add New Post**.
2. Enter the title. It becomes the large heading on the page.
3. Write the article in the main area. Start your headings at **Heading 2**, because the title is already the top-level heading.
4. Open the **Post** tab in the right sidebar.
5. Choose or create a **Category**. Avoid leaving it as **Uncategorized**, because the category name is shown above the title.
6. Set the **Featured image**, ideally a landscape 3:2 photo at least 1600 px wide, and add alt text.
7. Write the **Excerpt**, one or two sentences.
8. Check the **Slug** under **URL**. Keep it short, and do not change it after publishing.
9. Click **Publish**.

To publish later, change **Publish: Immediately** to a future date before clicking **Schedule**. The site rebuilds when the post goes out.

### Where each field appears

| WordPress field | On the storefront                                                              |
| --------------- | ------------------------------------------------------------------------------ |
| Title           | Page heading, journal cards and search results                                 |
| Excerpt         | Introduction under the title, and the description in search results            |
| Content         | The body of the article                                                        |
| Featured image  | Large image on the page, journal cards and the preview when the link is shared |
| Category        | Small label above the title                                                    |
| Publish date    | Shown beside the category, and sets the order of posts                         |

**Excerpt or content:** the excerpt is a short summary that sits above the article, while the content is the article itself. Do not paste the same opening paragraph into both, or it will appear twice in a row.

Comments, tags and the author's name are not shown on the storefront.

### Edit or remove a post

Open it under **Posts → All Posts**, change it and click **Save** or **Update**. To take it down, switch it to **Draft** or click **Move to Trash**. Its page disappears after the rebuild, so any links to it stop working.

## About page, Contact page and maker posts

These smaller content types are also managed in WordPress.

| Content                 | Where                     | How it works                                                                                                                     |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| About page              | **Pages**, slug `about`   | Title is the page heading, and content is the main text                                                                          |
| Contact page            | **Pages**, slug `contact` | Title is the page heading, and content appears above the form                                                                    |
| "Made by you" home wall | **Maker posts**           | Title is the Instagram handle, Excerpt is the caption, and Featured image is the photo. Lower **Order** numbers come first. A post without an image is not shown |

Other pages created under **Pages** do not appear on the storefront. The policies page and the home page's text are part of the site's code, so ask your developer to change them.

## Settings

Most day-to-day settings are under **Craft & Colours → Settings**. Administrators and Shop Managers can open it.

### Craft & Colours menu

| Setting                | What it does                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Announcement ticker    | Scrolling text at the top of every page. Enter one announcement per line, or leave empty to hide it                          |
| Gift product           | Product added free once the cart reaches KES 5,000. It must be a simple product priced at 0, set to **Hidden**, with stock managed |
| Default "Good to know" | Used on any product whose own **Good to know** box is empty                                                                  |
| Storefront rebuild     | Shows the last and next rebuild requests, with a **Rebuild now** button                                                      |
| Subscribers            | Newsletter sign-ups, with **Download CSV**                                                                                   |

### WooCommerce settings

Go to **WooCommerce → Settings**. Change these only when the shop's policy changes.

| Tab                 | What it controls                               | Expected setup                                                                                  |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| General             | Store address, selling countries, currency     | Village Market, Nairobi. Kenyan shilling (KES)                                                 |
| Products → Inventory | Stock management and low-stock level          | Stock management on, low stock at 2, as shown in the **Low stock** dashboard box               |
| Shipping            | Delivery zones, prices and free delivery       | See the table below                                                                            |
| Payments            | How customers pay                              | **Order now, pay on confirmation** is the only method. Keep it on, or checkout will not work   |
| Emails              | Order email wording and sender details         | Sent using WP Mail SMTP                                                                        |
| Site visibility     | Whether the WooCommerce store is live          | Should be **Live**. A "Coming soon" badge at the top of WordPress means it is not           |

| Delivery zone (order matters) | Regions          | Methods                                                                   |
| ----------------------------- | ---------------- | ------------------------------------------------------------------------- |
| Nairobi                       | Nairobi County   | Flat rate KES 300. Free shipping on orders of KES 4,500 or more           |
| Rest of Kenya                 | Kenya            | Flat rate KES 0, titled "Courier — cost confirmed on WhatsApp"            |
| Uganda & Tanzania             | Uganda, Tanzania | Flat rate KES 0, titled "Courier — cost confirmed on WhatsApp"            |

WooCommerce uses the first zone that matches, so keep Nairobi at the top. If an address matches no zone, the customer sees "No delivery options are available".

### WordPress settings to leave alone

Only Administrators can open **Settings**. These values are needed for the storefront to work:

| Setting                  | Keep it as                      | If it changes                                          |
| ------------------------ | ------------------------------- | ------------------------------------------------------ |
| General → Timezone       | Nairobi                         | Workshop times shift                                   |
| Permalinks               | Post name                       | The site cannot read content, and rebuilds fail        |
| General → WordPress and Site Address | `https://cms.craftandcolors.africa` | Login and the storefront's connection can break |

Also leave the **Plugins → Must-Use** entry named Craft & Colours in place, and keep WP Mail SMTP active. Contact messages, RSVP confirmations and order emails depend on email working.

### Settings that need a developer

These are not in WordPress menus:

- The free-gift threshold of KES 5,000.
- The storefront's WhatsApp number, contact email and social links.
- The 5-minute delay before a rebuild.

## Users

Give each person their own login, with the lowest role that covers their work. Only Administrators can add staff accounts.

### Roles

| Role          | Can do                                                                                     | Best for                               |
| ------------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| Administrator | Everything, including plugins, users and WordPress settings                                | The owner or developer. Keep to 1 or 2 |
| Shop Manager  | Products, orders, customers, WooCommerce settings, Craft & Colours, posts and pages         | Someone running the shop every day     |
| Editor        | Posts, pages, workshops, maker posts and media. **No** products, orders or rebuild button   | Someone writing content only           |
| Author        | Their own posts and workshops, and uploading images                                        | An occasional writer                   |
| Customer      | No admin work. WooCommerce uses this role for shoppers with accounts                        | Do not use for staff                   |

A Shop Manager also sees orders and customer details, so choose this role only for someone who should see them.

### Add a user

1. Go to **Users → Add New User**.
2. Enter a **Username**. It cannot be changed later.
3. Enter the person's own **Email**.
4. Add their first and last name.
5. Keep the generated **Password**, and leave **Send User Notification** ticked. They receive an email to set up their login.
6. Choose the **Role**.
7. Click **Add New User**.

### Change or remove a user

| To do this                  | Do this                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Change a role or email      | **Users → All Users**, click **Edit**, change it and click **Update User**                                |
| Reset a forgotten password  | Hover over the user and click **Send password reset**, or use **Lost your password?** on the login page   |
| Remove someone who has left | Hover over the user and click **Delete**. Choose **Attribute all content to** another user, then confirm |

Choose **Attribute all content to** when deleting. The other option deletes everything that person wrote.

Never share a login or send a password by chat or email. Remove accounts on the day someone leaves.

## Troubleshooting

| Problem                                       | What to check                                                                                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| My change is not on the site                  | Wait 20 minutes and refresh the page. Then open **Craft & Colours → Settings** and look at **Storefront rebuild**. Click **Rebuild now** if nothing is pending                                       |
| Rebuild shows "failed"                        | Note the HTTP number and send it to your developer. The GitHub access token may have expired or be incorrect                                                                                         |
| "Next scheduled" stays in the past            | The scheduled task on the server has stopped. Click **Rebuild now**, then tell your developer                                                                                                        |
| A rebuild ran but the site did not change     | The build may have failed, and the live site keeps its last good version. Ask your developer to check GitHub Actions                                                                                  |
| A product is missing from the shop            | Check that it is published, its **Catalog visibility** is not **Hidden**, and it has a category                                                                                                      |
| A product cannot be added to the cart         | Check that it has a price and is in stock. For a variable product, check that each variation has a price                                                                                             |
| A shop filter is missing                      | Check that **Show** is ticked on that category, the attribute is global, and a product directly in the category uses it                                                                              |
| A workshop is missing                         | Check that it is published and has a **Starts** date                                                                                                                                                  |
| A free workshop shows as fully booked         | Check that **Capacity** is above 0 and above the number of RSVPs                                                                                                                                      |
| A ticket is missing from the **Ticket product** list | Check that the ticket is ticked **Virtual** and is published                                                                                                                                  |
| Customers see "No delivery options are available" | Check that a shipping zone under **WooCommerce → Settings → Shipping** covers their address                                                                                                       |
| Emails are not arriving                       | Send a test from **WP Mail SMTP → Tools → Email Test**, and check the spam folder                                                                                                                     |
| A shared link shows an old image              | Social apps store previews for a while. Facebook's Sharing Debugger can refresh it, and WhatsApp may take longer                                                                                      |
