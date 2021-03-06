var reward_fund = 0;
var recent_claims = 0;
var price_of_steem = 0;
var steem_per_mvests = 0;
var reserve_rate = 0;
var myvote = 0;
var theirvote = 0;
var myaccountname = "";
var exceeds = false;
var vote1 = 0;
var vote2 = 0;
var votecut = 0;
var account1 = "";
var account2 = "";
var formstate = 0;
var itemshowing = 0;
var currentbarterid = 0;
/* Functions using steem.js to fetch global properties and account vote values */
steem.api.getRewardFund("post", function(err, fund) {
    reward_fund = parseFloat(fund.reward_balance.replace(" STEEM", ""));
    recent_claims = parseInt(fund.recent_claims, 10);
    steem.api.getCurrentMedianHistoryPrice(function(err, price) {
        price_of_steem = parseFloat(price.base.replace(" SBD", ""));
        steem.api.getDynamicGlobalProperties(function(err, gprops) {
            var vfs = parseFloat(gprops.total_vesting_fund_steem.replace(" STEEM", ""));
            var tvs = parseFloat(gprops.total_vesting_shares.replace(" STEEM", ""));
            reserve_rate = parseFloat(gprops.vote_power_reserve_rate);
            steem_per_mvests = vfs / (tvs / 1000000);
            steem_callback();
        });
    });
});
/* The following functions were copied directly from steem-python as steem.js
did not have similar functions and these values are needed for calculating vote values */
function steem_callback () {
    get_all_votes();
    disableform();
}
function vests_to_sp(vests) {
    return vests / 1000000 * steem_per_mvests;
}
function sp_to_vests(sp) {
    return sp * 1000000 / steem_per_mvests;
}
function sp_to_rshares(steempower, votepower, voteweight) {
    var vesting_shares = parseInt(sp_to_vests(steempower) * 1000000);
    var used_power = parseInt((votepower * voteweight) / 10000);
    var max_vote_denom = reserve_rate * (5 * 60 * 60 * 24) / (60 * 60 * 24);
    used_power = parseInt((used_power + max_vote_denom - 1) / max_vote_denom);
    var rshares = ((vesting_shares * used_power) / 10000);
    return rshares;
}
function rshares_to_steem(rshares) {
    return rshares * reward_fund / recent_claims * price_of_steem;
}
/* The get_vote_value function is at the heart of the script: it retrieves
a steemit account using steem.js then calculates the vote value based on
global properties fetched at page initialization */
function get_vote_value(accountname, weight, flag, id) {
    var regex = new RegExp('[^A-Za-z0-9\\.\\-\\_]', 'g');
    accountname = accountname.replace(regex, '');
    weight = weight * 100;
    steem.api.getAccounts([accountname], function(err, result) {
        if ((result != null) && (result != "")){
            var vesting_shares = parseFloat(result[0]['vesting_shares'].replace(" VESTS", ""));
            var delegated_vesting_shares = parseFloat(result[0]['delegated_vesting_shares'].replace(" VESTS", ""));
            var received_vesting_shares = parseFloat(result[0]['received_vesting_shares'].replace(" VESTS", ""));
            var totalvests = vesting_shares - delegated_vesting_shares + received_vesting_shares;
            var steem_power = vests_to_sp(totalvests);
            var rshares = sp_to_rshares(steem_power, 10000, weight);
            var vote_value = rshares_to_steem(rshares);
            // Flag 1 is raised when retreiving the vote value of the main account
            if (flag === 1) {
                myvote = vote_value;
                myaccountname = accountname;
                document.getElementById(accountname+"vote").innerHTML = '@' + accountname + ' $' + parseFloat(vote_value).toFixed(4);
            }
            /* Flag 2 is raised when retreiving the vote value for 
            the account entered into the form on the index page.*/
            if (flag === 2) {
                theirvote = vote_value;
                document.getElementById("errormsg").innerHTML = "@" + accountname +  " $" + parseFloat(vote_value).toFixed(4);
                enableform();
                input_correct(document.getElementById("accountbox"));
            }
            /* Flag 3 is raised when submitting the form on the index page and
            ensures the account name is still valid */
            if (flag === 3) {
                theirvote = vote_value;
                enableform();
                verifyform_callback();
            }
            /* Flag 4 is raised when retreiving the vote value of an account that is
            listed on the exchange table on the steemax.info page.   */
            if (flag === 4) {
                document.getElementById("votevalue"+id).value = vote_value;
                compare_votes_info_callback(id);
            }
            /* Flag 5 is raised when retrieving the vote value for the account being compared
            in the barter pop-up box on steemax.info  */
            if (flag === 5) {
                document.getElementById("votevalue"+id).value = vote_value;
                compare_votes_index(id);
            }
        }
        else if ((flag > 1) && (flag != 4)){
            disableform();
            input_error(document.getElementById("accountbox"));
            document.getElementById("errormsg").innerHTML = "Invalid account name.";
            if (flag === 3) {
                verifyform_callback();
            }
        }
    });
}
/* Functions for validating the the data entered into form on the index page */ 
function enableform () {
    document.getElementById("percentage").focus();
    formstate = 1;
}
function disableform () {
    formstate = 0;
}
function input_error(obj) {
    obj.className = "inputshadowerror";
    document.getElementById("errormsg").style.color = "#ff9f51";
} 
function input_correct(obj) {
    obj.className = "inputshadow";
    document.getElementById("errormsg").style.color = "#333333";
}
function fix_values(per, ratio) {
    per = document.getElementById("percentage");
    ratio = document.getElementById("ratio");
    if (per.value > 100) {per.value = 100;}
    else if (per.value < 1) {per.value = 1;}
    if (ratio.value > 1000) {ratio.value = 1000;}
    else if (ratio.value < 0.001) {ratio.value = 1;}
}
function verifyform() {
    var regex = new RegExp('[^0-9\\.]', 'g');
    per = document.getElementById("percentage").value;
    per = per.replace(regex, '');
    ratio = document.getElementById("ratio").value;
    ratio = ratio.replace(regex, '');
    dur = document.getElementById("duration").value;
    dur = dur.replace(regex, '');
    acctname = document.getElementById("accountbox").value;
    var regex = new RegExp('[^A-Za-z0-9\\.\\-\\_]', 'g');
    acctname = acctname.replace(regex, '');
    if (acctname === "steem-ax") {
        alert("You may not create an exchange with @steem-ax.");
        return false;
    }
    if (acctname === myaccountname) {
        alert("You may not exchange with yourself, Silly.");
        return false;
    }
    if (acctname === "") {
        alert("Please enter an Steemit.com account name.");
        return false;
    }
    else if ((per < 0) || (per > 100)) {
        alert("Please enter a percentage between 1 and 100.");
        fix_values();
        return false;
    }
    else if ((ratio < 0.001) || (ratio > 1000)) {
        alert("Please enter a ratio between 0.001 and 1000.");
        fix_values();
        return false;
    }
    else if ((dur < 7) || (dur > 365)) {
        alert("Please enter a duration between 7 days and 365 days.");
        return false;
    }
    else {
        document.getElementById("exchange-button").style.display = "none";
        document.getElementById("loadergif").style.display = "block";
        document.getElementById("accountbox").focus();
        get_vote_value(acctname, 100, 3, 0);
    }
}
function verifyform_callback() {
    if (formstate === 1) {
        document.getElementById('axform').submit();
    }
    else { 
        alert("Please enter a valid account name.");
        document.getElementById("exchange-button").style.display = "block";
        document.getElementById("loadergif").style.display = "none";
    }
}
/* Functions for calculating vote values */
function assign_votes(id) {
    regex = new RegExp('[^A-Za-z0-9\\.\\-\\_]', 'g');
    if (id > 0) {
        var otheraccount = document.getElementById("otheraccount"+id).value.replace(regex, '');
        var votevalue = document.getElementById("votevalue"+id).value;
        if (document.getElementById("invitee"+id).value == 0) {
            vote1 = myvote;
            vote2 = votevalue;
            account1 = myaccountname;
            account2 = otheraccount;
        }
        else {
            vote2 = myvote;
            vote1 = votevalue;
            account2 = myaccountname;
            account1 = otheraccount;
        }
    }
    else {
        vote1 = myvote;
        vote2 = theirvote;
        account1 = myaccountname;
        account2 = document.getElementById("accountbox").value.replace(regex, '');
    }
}
function calc_vote1(percentage) {
    vote1 = vote1 * (percentage / 100);
}
function calc_vote2(ratio) {
    votecut = ((vote1 / vote2) * 100) / ratio;
    if (votecut < 1) {votecut = 1; exceeds = true;}
    if (votecut > 100) {votecut = 100; exceeds = true;}
    vote2 = vote2 * (votecut / 100);
}
function calc_votes(id) {
    var regex = new RegExp('[^0-9\\.]', 'g');
    var ratio = 0;
    var percentage = 0;
    if (id > 0) {
        ratio = document.getElementById("ratio"+id).value.replace(regex, '');
        percentage = document.getElementById("percentage"+id).value.replace(regex, '');
    }
    else {
        ratio = document.getElementById("ratio").value.replace(regex, '');
        percentage = document.getElementById("percentage").value.replace(regex, '');
    }
    calc_vote1(percentage);
    calc_vote2(ratio);
    vote1 = parseFloat(vote1).toFixed(4);
    vote2 = parseFloat(vote2).toFixed(4);
}
function compare_votes_info_callback(id) {
    assign_votes(id);
    calc_votes(id);
    document.getElementById("compare"+id).innerHTML = ("$"+vote1+" vs. $"+vote2);
    show_item(id);
}
function compare_votes_info(id) {
    if (document.getElementById("votevalue"+id).value > 0) {
        compare_votes_info_callback(id);
    }
    else {
        regex = new RegExp('[^A-Za-z0-9\\.\\-\\_]', 'g');
        var otheraccount = document.getElementById("otheraccount"+id).value.replace(regex, '');
        get_vote_value(otheraccount, 100, 4, id);
    }
}
function compare_votes_index(id) {
    exceeds = false;
    assign_votes(id);
    calc_votes();
    var votediff = 0;
    if (exceeds) {
        if (votecut === 1) {
            votediff = vote2 - vote1;
            votediff = parseFloat(votediff).toFixed(6);
            document.getElementById("errormsg").innerHTML = ("@" + account1 + " is too large by $" + votediff);
        }
        if (votecut === 100) {
            votediff = vote1 - vote2;
            votediff = parseFloat(votediff).toFixed(6);
            document.getElementById("errormsg").innerHTML = ("@" + account2 + " is too large by $" + votediff);
        }
        input_error(document.getElementById("percentage"));
        input_error(document.getElementById("ratio"));
    }
    else {
        document.getElementById("errormsg").innerHTML = ("$"+vote1+" vs. $"+vote2);
        input_correct(document.getElementById("percentage"));
        input_correct(document.getElementById("ratio"));
    }
}
/* functions used for the barter window and for controlling
css GUI features on steemax.info  */
function command(id, account, command) {
    var memoid = document.getElementById("storedmemoid"+id).value;
    var memomsg = memoid + ":" + command;
    document.getElementById("memoid"+id).value = memomsg;
    compare_votes_info(id);
}
function show_item(id) {
    hide_item();
    var memo = document.getElementById("memo"+id);
    memo.style.display = 'block';
    memo.offsetHeight;
    memo.style.opacity = '1';
    itemshowing = id;
}
function hide_item() {
    if (document.getElementById("memo"+itemshowing)) {
        document.getElementById("memo"+itemshowing).style.display = 'none';
        document.getElementById("memo"+itemshowing).style.opacity = '0';
    }
}
function barter_window(id) {
    currentbarterid = id;
    var modal = document.getElementById("myModal");
    modal.style.display = 'block';
    modal.offsetHeight;
    modal.style.opacity = '1';
    var modalcontent = document.getElementById("modal-content");
    modalcontent.style.display = 'block';
    modalcontent.offsetHeight;
    modalcontent.style.opacity = '1';
    document.getElementById("percentage").value = document.getElementById("percentage"+id).value;
    document.getElementById("ratio").value = document.getElementById("ratio"+id).value;
    document.getElementById("duration").value = document.getElementById("duration"+id).value;
    if (document.getElementById("votevalue"+id).value > 0) {
        compare_votes_index(id);
    }
    else {
        get_vote_value(document.getElementById("otheraccount"+id).value, 100, 5, id);
    }
}
function close_modal() {
    document.getElementById("myModal").style.display = "none";
    document.getElementById("myModal").style.opacity = '0';
}
function make_barter_memo() {
    close_modal();
    var memoid = document.getElementById("storedmemoid"+currentbarterid).value;
    var percentage = document.getElementById("percentage").value;
    var ratio = document.getElementById("ratio").value;
    var duration = document.getElementById("duration").value;
    var memomsg = memoid + ":barter" + ":" + percentage + ":" + ratio + ":" + duration;
    document.getElementById("memoid"+currentbarterid).value = memomsg;
    document.getElementById("votevalue"+currentbarterid).value = 0;
    compare_votes_info(currentbarterid);
}
