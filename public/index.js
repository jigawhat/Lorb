// Lorb index javascript

$( function() {

    var i = 0;

    // Import champion data
    $.getJSON( "champ_list.json", function( data ) {

        // Constants
        var champ_list = data; // Riot champion data

        var ch_cid_li = 0; // Indexes of each feature in champ_list
        var ch_id_li = 1;
        var ch_name_li = 2;

        // Create dictionary from indexes to cids
        var champ_ind_dict = {};
        for (i = 0; i < champ_list.length; i++) {
            champ_ind_dict[champ_list[i][ch_cid_li]] = i;
        }

        var ddrag_ver = "8.20.1";
        var ddrag_url = "https://ddragon.leagueoflegends.com/cdn/" + ddrag_ver + "/img/champion/";
        var none_champ_img = "imgs/searchicon.png";
        var roles_ord = ['Top', 'Jungle', 'Middle', 'Support', 'Bottom'];

        // Champion grid element
        var grid_content = '';
        for (i = 0; i < champ_list.length; i++) {
            var img_url = none_champ_img;
            if (i > 0) {
                img_url = ddrag_url + champ_list[i][ch_id_li] + '.png';
            }
            grid_content += '<img src="' + img_url + '" height="60" width="60" class="grid_img" id="grid_img_' + i + '">';
        }
        $("body").append($('<div id="champion_grid_cont" class="hide"><div id="champion_grid">' +
            grid_content + '</div></div>'));

        // Data
        var req_data = [
            [ 0, 0, -1, -1 ],
            [ 0, 1, -1, -1 ],
            [ 0, 2, -1, -1 ],
            [ 0, 3, -1, -1 ],
            [ 0, 4, -1, -1 ],
            [ 1, 0, -1, -1 ],
            [ 1, 1, -1, -1 ],
            [ 1, 2, -1, -1 ],
            [ 1, 3, -1, -1 ],
            [ 1, 4, -1, -1 ],
        ];

        var team_li = 0; // Indexes of each feature in req_data
        var role_li = 1;
        var cid_li = 2;
        var opgg_li = 3;

        var app_height = $( "#app_area" ).height();
        var app_width = $( "#app_area" ).width();

        var plph_occupancy = {}; // For each placeholder, which pl_i player occupies it

        // var pl_inner = '<form id="myForm" action="comment.php" method="post"> ' +
        //     'Name: <input type="text" name="name" /> ' + 
        //     'Comment: <textarea name="comment"></textarea> ' + 
        //     '<input type="submit" value="Submit Comment" /></form>'
        var pl_inner = '<div class="champion_buttons">' + 
            '<button class="search_button">s</button>' +
            '<button class="grid_button">g</button></div>' + 
            '<div class="champion_box"></div>' + 
            '<div class="role_cont"><select class="role_select">';
        var l_roles = {};
        var r_roles = {};
        for (i = 0; i < 5; i++) {
            pl_inner += '<option value=' + i + '>' + roles_ord[i] + '</option>';
            l_roles[i] = i;
            r_roles[i] = i + 5;
        }
        pl_inner += '</select></div>' +
            '<div class="name_cont"><input type="text" placeholder="[unknown]" class="name_input"></input></div>' +
            '';

        // Create left side player objects, and all player placeholders
        for (i = 0; i < 5; i++) {
            $( "#pl_area" ).append($('<div id="pl_' + i + '" class="pl pl_obj pl_w_obj" plph_id="plph_l_' +
                i + '">' + pl_inner + '</div>'));
            plph_occupancy['plph_l_' + i] = i
            $( "#l_team_area" ).append($('<div id="plph_l_' + i + '" class="plph pl_obj pl_w_obj"></div>'));
            $( "#r_team_area" ).append($('<div id="plph_r_' + i + '" class="plph pl_obj pl_w_obj"></div>'));
        }

        // Get dimensions info from new objects
        var pl_height = $( ".pl" ).height();
        var pl_width = $( ".pl" ).width(); // for some reason this sometimes returns the width + 1...
        // pl_width -= 1;
        var pl_tot_height = 5 * pl_height;
        var r_pl_x = app_width - pl_width; // right side player object x co-ordinate

        // Create right side player objects and move all to correct positions
        for (i = 5; i < 10; i++) {
            $( "#pl_area" ).append($('<div id="pl_' + i + '" class="pl pl_obj pl_w_obj" plph_id="plph_r_' + 
                (i - 5) + '">' + pl_inner + '</div>'));
            plph_occupancy['plph_r_' + (i - 5)] = i
            $( "#pl_" + i ).css('left', r_pl_x);
            $( "#pl_" + i ).css('top', (i - 5) * pl_height);
            $( "#pl_" + (i - 5) ).css('top', (i - 5) * pl_height);
        }

        // Set correct initial roles for each player
        for (i = 0; i < 5; i++) {
            $( "#pl_" + i ).find(".role_cont").find(".role_select")[0].selectedIndex = i
            $( "#pl_" + (i + 5) ).find(".role_cont").find(".role_select")[0].selectedIndex = i
        }
        // Define procedure for changing a role
        $( ".role_select" ).change(function() {
            var pl_id = $( this ).parent().parent().attr("id");
            var pl_i = parseInt(pl_id[pl_id.length - 1]);
            var prev_role = req_data[pl_i][role_li];
            var sel_ind = $( this )[0].selectedIndex;
            if (prev_role != sel_ind) {
                var prev_pl_i;
                if (req_data[pl_i][team_li] == 0) {
                    prev_pl_i = l_roles[sel_ind];
                    l_roles[sel_ind] = pl_i;
                    l_roles[prev_role] = prev_pl_i;
                } else {
                    prev_pl_i = r_roles[sel_ind];
                    r_roles[sel_ind] = pl_i;
                    r_roles[prev_role] = prev_pl_i;
                }
                req_data[pl_i][role_li] = sel_ind;
                req_data[prev_pl_i][role_li] = prev_role;
                $( "#pl_" + prev_pl_i ).find(".role_cont").find(".role_select")[0].selectedIndex = prev_role
            }
        });

        // Define champion search dropdown box
        var search_dropdown_inner = '<div class="search_dropdown">' +
            '<select data-placeholder="None (Unknown)" class="chosen-select search_select" tabindex="1">';
        for (i = 0; i < champ_list.length; i++) {
            ch = champ_list[i];
            search_dropdown_inner += '<option value="' + ch[ch_cid_li] + '">' + ch[ch_name_li] + '</option>';
        }
        search_dropdown_inner += '</select></div>';
            // '<option value="-1">None (Unknown)</option>' +
            // '<option value="0">United States</option>' +
            // '<option value="1">United Kingdom</option>' +
            // '</select>' + 
            // '</div>';
        $( "#pl_area" ).append(search_dropdown_inner);

        var ch_pl_i = 0; // Current pl index for which we are selecting a champion
        var selected_ch_indices = [...Array(10).keys()].map(i => 0); // Selected champion list indices for each pl

        // Define champion grid triggers
        $( ".grid_button" ).click(function() { // Make grid appear
            $("#champion_grid_cont").toggleClass("hide");
            $("#champion_grid_cont").toggleClass("show");

            var pl_id = $( this ).parent().parent().attr("id");

            // Set the current pl_i for editing the selected champion
            ch_pl_i = parseInt(pl_id[pl_id.length - 1]);

            // Highlight the currently selected champion in the grid
            current_i = selected_ch_indices[ch_pl_i];
            curr_img_id = 'grid_img_' + current_i;
            $( "#" + curr_img_id ).addClass("grid_img_selected");
        });
        $( "#champion_grid_cont" ).click(function() { // Make grid disappear
            $(this).toggleClass("show");
            $(this).toggleClass("hide");

            var current_i = selected_ch_indices[ch_pl_i];
            var curr_img_id = 'grid_img_' + current_i;
            $( "#" + curr_img_id ).removeClass("grid_img_selected");
        });
        $( ".grid_img" ).click(function(event) { // Make grid disappear after setting new champion
            event.stopPropagation(); // Stop click event from propagating to the container
            $("#champion_grid_cont").toggleClass("show");
            $("#champion_grid_cont").toggleClass("hide");

            var current_i = selected_ch_indices[ch_pl_i];

            var sel_ind = $(this).attr("id").split('_');
            sel_ind = parseInt(sel_ind[sel_ind.length - 1]);
            selected_ch_indices[ch_pl_i] = sel_ind;
            var new_cid = champ_list[sel_ind][ch_cid_li];
            var old_cid = req_data[ch_pl_i][cid_li];
            req_data[ch_pl_i][cid_li] = new_cid;
            if (sel_ind > 0) {
                // If there is another entry with the same champion, switch champions with that player
                for (i = 0; i < 10; i++) {
                    if (i == ch_pl_i) {
                        continue;
                    }
                    if (req_data[i][cid_li] == new_cid) {
                        req_data[i][cid_li] = old_cid;
                        old_sel_ind = champ_ind_dict[old_cid];
                        selected_ch_indices[i] = old_sel_ind;
                        if (old_cid != -1) {
                            $( '#pl_' + i ).find( '.champion_box' ).css(
                                "background-image", 'url(' + ddrag_url + champ_list[old_sel_ind][ch_id_li] + '.png)');
                        } else {
                            $( '#pl_' + i ).find( '.champion_box' ).css(
                                "background-image", 'url(' + none_champ_img + ')');
                        }
                        break;
                    }
                }
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + ddrag_url + champ_list[sel_ind][ch_id_li] + '.png)');
            } else {
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + none_champ_img + ')');
            }

            var curr_img_id = 'grid_img_' + current_i;
            $( "#" + curr_img_id ).removeClass("grid_img_selected");
        });

        // Define team colour switching
        var left_col = "Blue";
        var left_text_col = "blue";
        var right_col = "Red";
        var right_text_col = "red";
        $( "#switch_cols_button" ).click(function() {
            left_col = [right_col, right_col = left_col][0]; // Swap variable values (pre-ES6 compatible)
            left_text_col = [right_text_col, right_text_col = left_text_col][0];
            $( "#l_team_col" ).html(left_col);
            $( "#l_team_col" ).css("color", left_text_col);
            $( "#r_team_col" ).html(right_col);
            $( "#r_team_col" ).css("color", right_text_col);
            for (i = 0; i < 10; i++) {
                req_data[i][0] = 1 - req_data[i][0];
            }
        });

        // Define champion search show/hide trigger & positioning
        $( ".search_button" ).click(function() {
            var dropdown_elem = $( ".search_dropdown" );
            dropdown_elem.toggleClass("hide");
            // dropdown_elem.toggleClass("show");

            if (!dropdown_elem.hasClass("hide")) {
                var pl_id = $( this ).parent().parent().attr("id");

                // Set the current pl_i for editing the selected champion
                ch_pl_i = parseInt(pl_id[pl_id.length - 1]);
                $( ".search_select" )[0].selectedIndex = selected_ch_indices[ch_pl_i];
                $( ".search_select" ).trigger('chosen:updated');
                pos_x = parseInt($( '#' + pl_id ).css('left')) + 30;
                pos_y = parseInt($( '#' + pl_id ).css('top')) + pl_height - 5;
                dropdown_elem.css("left", pos_x);
                dropdown_elem.css("top", pos_y);
                // $( ".search_select" ).trigger("chosen:open"); // Should work but doesn't
                // $( ".search_select" ).trigger("chosen:activate");
                setTimeout(function() {
                    $( ".search_select" ).trigger("chosen:open");
                }, 0);
            }
        });
        // Initialise chosen select box for champion search
        $( ".chosen-select" ).chosen({no_results_text: "No champions found"});
        $( ".search_dropdown" ).toggleClass("hide");
        // Tell chosen select box to hide itself after a selection is made
        $('.search_select').on('chosen:hiding_dropdown', function(evt, params) {
            var dropdown_elem = $( ".search_dropdown" );
            // dropdown_elem.toggleClass("show");
            dropdown_elem.addClass("hide");

            // At this point, set the new champion id & image
            var sel_ind = $(this)[0].selectedIndex;
            selected_ch_indices[ch_pl_i] = sel_ind;
            var new_cid = champ_list[sel_ind][ch_cid_li];
            var old_cid = req_data[ch_pl_i][cid_li];
            req_data[ch_pl_i][cid_li] = new_cid;
            if (sel_ind > 0) {
                // If there is another entry with the same champion, switch champions with that player
                for (i = 0; i < 10; i++) {
                    if (i == ch_pl_i) {
                        continue;
                    }
                    if (req_data[i][cid_li] == new_cid) {
                        req_data[i][cid_li] = old_cid;
                        old_sel_ind = champ_ind_dict[old_cid];
                        selected_ch_indices[i] = old_sel_ind;
                        if (old_cid != -1) {
                            $( '#pl_' + i ).find( '.champion_box' ).css(
                                "background-image", 'url(' + ddrag_url + champ_list[old_sel_ind][ch_id_li] + '.png)');
                        } else {
                            $( '#pl_' + i ).find( '.champion_box' ).css(
                                "background-image", 'url(' + none_champ_img + ')');
                        }
                        break;
                    }
                }
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + ddrag_url + champ_list[sel_ind][ch_id_li] + '.png)');
            } else {
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + none_champ_img + ')');
            }
        });

        // Player draggable definition
        $( ".pl" ).draggable({ snap: ".plph", snapMode: "inner", snapTolerance: 15,
            start: function( event, ui ) {

                // Set z-index to 1000 for the element we're dragging
                ui.helper.css("zIndex", 1000);

            },
            drag: function( event, ui ) {

                // If we're on the y grid and x is less than pl_width / 3 distance from
                // the nearest placeholder, snap to that placeholder position
                if (ui.position.top % pl_height == 0) {
                    if (Math.abs(ui.position.left) < (pl_width / 3)) {
                        ui.position.left = 0;
                    } else if (Math.abs(ui.position.left - r_pl_x) < (pl_width / 3)) {
                        ui.position.left = r_pl_x;
                    }
                }
            },
            stop: function( event, ui ) {

                // Get i of dragged player
                var pl_id = ui.helper.attr("id");
                pl_i = parseInt(pl_id[pl_id.length - 1]);

                // Figure out which side & placeholder we've snapped to, if any
                new_side = -1;
                if (ui.position.top % pl_height == 0) {
                    if (ui.position.left == 0) {
                        new_side = 'l';
                    } else if (ui.position.left == r_pl_x) {
                        new_side = 'r';
                    }
                }

                // If we've snapped to a placeholder
                if (new_side != -1) {

                    // Set z-index back to default
                    ui.helper.css("zIndex", 0);

                    // Get current plph_id of dragged player
                    plph_id = ui.helper.attr("plph_id");

                    // Figure out what the new plph_id is
                    new_team_pl_i = ui.position.top / pl_height;
                    new_plph_id = "plph_" + new_side + '_' + new_team_pl_i;

                    // If the new one is different
                    if (new_plph_id != plph_id) {

                        // Get side and team_pl_i of current plph_i
                        side = plph_id[5];
                        team_pl_i = parseInt(plph_id[plph_id.length - 1]);

                        // Get the pl_i of the player currently at new_plph_id
                        old_pl_i = plph_occupancy[new_plph_id];

                        // If we swapped with the other team
                        if (side != new_side) {

                            // Set new colours
                            new_col = req_data[old_pl_i][team_li];
                            req_data[old_pl_i][team_li] = req_data[pl_i][team_li];
                            req_data[pl_i][team_li] = new_col;

                            // Set role variables
                            role = req_data[pl_i][role_li]
                            old_role = req_data[old_pl_i][role_li]
                            if (role != old_role) { // If roles differ
                                
                                // Set destination team roles
                                var occ_pl_i;
                                if (new_side == 'l') {
                                    occ_pl_i = l_roles[role];
                                    l_roles[role] = pl_i;
                                    l_roles[old_role] = occ_pl_i;
                                } else {
                                    occ_pl_i = r_roles[role];
                                    r_roles[role] = pl_i;
                                    r_roles[old_role] = occ_pl_i;
                                }
                                req_data[pl_i][role_li] = role;
                                req_data[occ_pl_i][role_li] = old_role;
                                $( "#pl_" + occ_pl_i ).find(".role_cont").find(".role_select")[0].selectedIndex = old_role
                                
                                // Set departing team roles
                                if (side == 'l') {
                                    occ_pl_i = l_roles[old_role];
                                    l_roles[old_role] = old_pl_i;
                                    l_roles[role] = occ_pl_i;
                                } else {
                                    occ_pl_i = r_roles[old_role];
                                    r_roles[old_role] = old_pl_i;
                                    r_roles[role] = occ_pl_i;
                                }
                                req_data[old_pl_i][role_li] = old_role;
                                req_data[occ_pl_i][role_li] = role;
                                $( "#pl_" + occ_pl_i ).find(".role_cont").find(".role_select")[0].selectedIndex = role
                            } else { // Roles are the same, just edit dictionary
                                if (new_side == 'l') {
                                    l_roles[role] = pl_i;
                                    r_roles[role] = old_pl_i;
                                } else {
                                    l_roles[role] = old_pl_i;
                                    r_roles[role] = pl_i;
                                }
                            }
                        }

                        // Set new placeholder occupancy
                        plph_occupancy[new_plph_id] = pl_i;
                        plph_occupancy[plph_id] = old_pl_i;
                        ui.helper.attr("plph_id", new_plph_id);
                        $( "#pl_" + old_pl_i ).attr("plph_id", plph_id);

                        // Set position of old_pl_i
                        new_x = (side == 'l') ? 0 : r_pl_x;
                        // $( "#pl_" + old_pl_i ).css('left', new_x);
                        // $( "#pl_" + old_pl_i ).css('top', team_pl_i * pl_height);
                        $( "#pl_" + old_pl_i ).css("zIndex", 1000);
                        $( "#pl_" + old_pl_i ).animate({'left': new_x, 'top': team_pl_i * pl_height});
                        $( "#pl_" + old_pl_i ).css("zIndex", 0);
                    }
                }

                // console.log(req_data);
            }
        });
    });

});


