$(document).ready(function() {
    $('#submit').on('click', function(){
        var post = make_post()
        $.ajax({
            url: '/posts',
            type: 'POST',
            data: post,
            success: (data) => {
                location.reload()
            }
        })
    })
    $("form").submit(function(e) {
        e.preventDefault();
    });
    $('#logout').on('click', function(){
        $.ajax({
            url: '/logout',
            type: 'GET',
            success: (data) => {
                location.reload()
            }
        })
    })
    $('.btn-danger').on('click', function(){
        const id = $(this).parent().children(".col-8").children('a').attr("href").split('/')[5]
        $.ajax({
            url: '/posts/' + id,
            type: 'DELETE',
            success: (data) => {
                location.reload()
            }
        })
    })
    $('.btn-secondary').on('click', function(){
        const id = $(this).parent().children(".col-8").children('a').attr("href").split('/')[5]
        console.log(id)
        $.ajax({
            url: '/posts/' + id,
            type: 'GET',
            success: (post) => {
                input_values(post)
                toggle_submit_edit()
                $('#cancel_edit').on('click', () => { input_values(null); toggle_submit_edit()})
                $('#done_edit').on('click', () => {
                    toggle_submit_edit();
                    const post = make_post_by_id(id)
                    $.ajax({
                        url: '/posts/' + id,
                        type: 'POST',
                        data: post,
                        success: () => {
                            location.reload()
                        }
                    })
                })
            }
        })   
    })
    $('.list-group-item').on('click', function() {
        const id = $(this).parent().attr('href').split('/')[5]
        $.ajax({
            type: 'GET',
            url: '/posts/post/' + id,
        })
    })
})


input_values = (post) => {
    if (post != null){
        $('#author').val(post.author)
        $('#title').val(post.title)
        $('#body').val(post.body)
    } else {
        $('#author').val('')
        $('#title').val('')
        $('#body').val('')
    }  
}

make_post = () => {
    return {title: $('#title').val(), author: $('#author').val(), body: $('#body').val()}
}

make_post_by_id = (id) => {
    return {_id: id, title: $('#title').val(), author: $('#author').val(), body: $('#body').val()}
}

toggle_submit_edit = () => {
    if ($('#submit').hasClass('invisible')){
        $('#submit').removeClass('invisible')
        $('#done_edit').addClass('invisible')
        $('#cancel_edit').addClass('invisible')
    } else {
        $('#submit').addClass('invisible')
        $('#done_edit').removeClass('invisible')
        $('#cancel_edit').removeClass('invisible')
    }
}



